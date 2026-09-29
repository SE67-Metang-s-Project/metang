import { prisma } from "@/lib/prisma";
import { Prisma, UserRoleName } from "@/lib/generated/prisma/client";
import { getCmuDisplayName, type CmuProfile } from "@/lib/cmu-auth";

export const superAdminUserSelect = {
  id: true,
  email: true,
  cmuAccount: true,
  studentCode: true,
  fullNameTh: true,
  fullNameEn: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      role: true,
      grantedBy: true,
      grantedAt: true,
    },
    orderBy: { role: "asc" },
  },
} satisfies Prisma.AppUserSelect;

export async function listUsersWithRoles() {
  return prisma.appUser.findMany({
    select: superAdminUserSelect,
    orderBy: [{ fullNameTh: "asc" }, { id: "asc" }],
  });
}

export type RoleMutationErrorCode =
  | "USER_NOT_FOUND"
  | "ROLE_ALREADY_GRANTED"
  | "ROLE_NOT_GRANTED"
  | "FINAL_SUPER_ADMIN"
  | "EXECUTIVE_ALREADY_EXISTS"
  | "EXECUTIVE_CANNOT_BE_DELETED"
  | "CANNOT_DELETE_SELF"
  | "EMAIL_ALREADY_IN_USE";

export class RoleMutationError extends Error {
  constructor(readonly code: RoleMutationErrorCode) {
    super(code);
  }
}

export async function mutateUserRole({
  actorId,
  targetUserId,
  action,
  role,
}: {
  actorId: string;
  targetUserId: string;
  action: "grant" | "remove";
  role: UserRoleName;
}) {
  return prisma.$transaction(async (tx) => {
    const target = await tx.appUser.findUnique({
      where: { id: targetUserId },
      select: superAdminUserSelect,
    });
    if (!target) throw new RoleMutationError("USER_NOT_FOUND");

    const beforeRoles = target.roles.map(({ role: currentRole }) => currentRole);
    const hasRole = beforeRoles.includes(role);

    if (action === "grant") {
      if (hasRole) throw new RoleMutationError("ROLE_ALREADY_GRANTED");
      if (role === "executive") {
        const executiveCount = await tx.userRole.count({
          where: { role: "executive", userId: { not: targetUserId } },
        });
        if (executiveCount > 0) throw new RoleMutationError("EXECUTIVE_ALREADY_EXISTS");
      }
      await tx.userRole.create({ data: { userId: targetUserId, role, grantedBy: actorId } });
    } else {
      if (!hasRole) throw new RoleMutationError("ROLE_NOT_GRANTED");
      if (role === "super_admin") {
        const superAdminCount = await tx.userRole.count({ where: { role: "super_admin" } });
        if (superAdminCount <= 1) throw new RoleMutationError("FINAL_SUPER_ADMIN");
      }

      if (role === "admin") {
        const activeLoans = await tx.loanRequest.findMany({
          where: {
            assignedAdminId: targetUserId,
            status: { in: ["pending_admin", "pending_executive"] },
          },
          select: { id: true, status: true, assignedAdminId: true },
        });
        const reassigned = await tx.loanRequest.updateMany({
          where: {
            assignedAdminId: targetUserId,
            status: { in: ["pending_admin", "pending_executive"] },
          },
          data: { assignedAdminId: actorId },
        });
        if (reassigned.count !== activeLoans.length) {
          throw new RoleMutationError("ROLE_NOT_GRANTED");
        }
        for (const loan of activeLoans) {
          await tx.auditLog.create({
            data: {
              actorId,
              action: "loan_request.admin_reassigned",
              entityType: "loan_request",
              entityId: loan.id,
              before: { assignedAdminId: loan.assignedAdminId, status: loan.status },
              after: { assignedAdminId: actorId, status: loan.status },
            },
          });
        }
      }
      await tx.userRole.delete({ where: { userId_role: { userId: targetUserId, role } } });
    }

    const updated = await tx.appUser.findUnique({
      where: { id: targetUserId },
      select: superAdminUserSelect,
    });
    if (!updated) throw new RoleMutationError("USER_NOT_FOUND");

    await tx.auditLog.create({
      data: {
        actorId,
        action: action === "grant" ? "user_role.granted" : "user_role.removed",
        entityType: "app_user",
        entityId: targetUserId,
        before: { roles: beforeRoles },
        after: { roles: updated.roles.map(({ role: currentRole }) => currentRole) },
      },
    });

    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createManagedUser({
  actorId,
  email,
  fullNameTh,
  fullNameEn,
  role,
}: {
  actorId: string;
  email: string;
  fullNameTh: string;
  fullNameEn?: string | null;
  role: "admin" | "super_admin";
}) {
  return prisma.$transaction(async (tx) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullNameTh = fullNameTh.trim();
    const cleanFullNameEn = fullNameEn ? fullNameEn.trim() : null;
    const cmuAccount = cleanEmail.split("@")[0];

    const existing = await tx.appUser.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { cmuAccount }],
      },
      include: {
        roles: { select: { role: true } },
      },
    });

    let targetUserId: string;

    if (existing) {
      targetUserId = existing.id;
      if (existing.roles.some((r) => r.role === role)) {
        throw new RoleMutationError("ROLE_ALREADY_GRANTED");
      }

      await tx.userRole.create({
        data: {
          userId: existing.id,
          role,
          grantedBy: actorId,
        },
      });

      const names = {
        fullNameTh: cleanFullNameTh,
        ...(cleanFullNameEn ? { fullNameEn: cleanFullNameEn } : {}),
      };
      await tx.appUser.update({ where: { id: existing.id }, data: names });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "user_role.granted",
          entityType: "app_user",
          entityId: existing.id,
          before: { fullNameTh: existing.fullNameTh, fullNameEn: existing.fullNameEn },
          after: { role, ...names },
        },
      });
    } else {
      const newUser = await tx.appUser.create({
        data: {
          email: cleanEmail,
          cmuAccount,
          fullNameTh: cleanFullNameTh,
          fullNameEn: cleanFullNameEn,
          educationLevel: "0",
        },
      });

      targetUserId = newUser.id;

      await tx.userRole.create({
        data: {
          userId: newUser.id,
          role,
          grantedBy: actorId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "user.created",
          entityType: "app_user",
          entityId: newUser.id,
          after: { email: cleanEmail, fullNameTh: cleanFullNameTh, role },
        },
      });
    }

    const created = await tx.appUser.findUnique({
      where: { id: targetUserId },
      select: superAdminUserSelect,
    });
    if (!created) throw new RoleMutationError("USER_NOT_FOUND");
    return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function deleteManagedUser({
  actorId,
  targetUserId,
}: {
  actorId: string;
  targetUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const target = await tx.appUser.findUnique({
      where: { id: targetUserId },
      select: superAdminUserSelect,
    });
    if (!target) throw new RoleMutationError("USER_NOT_FOUND");
    if (targetUserId === actorId) throw new RoleMutationError("CANNOT_DELETE_SELF");

    const targetRoleNames = target.roles.map((r) => r.role);

    // Guard: Check super admin count
    if (targetRoleNames.includes("super_admin")) {
      const superAdminCount = await tx.userRole.count({ where: { role: "super_admin" } });
      if (superAdminCount <= 1) {
        throw new RoleMutationError("FINAL_SUPER_ADMIN");
      }
    }

    // Guard: Executive cannot be deleted
    const isOnlyExecutive = targetRoleNames.length === 1 && targetRoleNames[0] === "executive";
    if (isOnlyExecutive) {
      throw new RoleMutationError("EXECUTIVE_CANNOT_BE_DELETED");
    }

    // Reassign active admin loans if target has admin
    if (targetRoleNames.includes("admin")) {
      const activeLoans = await tx.loanRequest.findMany({
        where: {
          assignedAdminId: targetUserId,
          status: { in: ["pending_admin", "pending_executive"] },
        },
        select: { id: true, status: true, assignedAdminId: true },
      });
      if (activeLoans.length > 0) {
        await tx.loanRequest.updateMany({
          where: {
            assignedAdminId: targetUserId,
            status: { in: ["pending_admin", "pending_executive"] },
          },
          data: { assignedAdminId: actorId },
        });
        for (const loan of activeLoans) {
          await tx.auditLog.create({
            data: {
              actorId,
              action: "loan_request.admin_reassigned",
              entityType: "loan_request",
              entityId: loan.id,
              before: { assignedAdminId: loan.assignedAdminId, status: loan.status },
              after: { assignedAdminId: actorId, status: loan.status },
            },
          });
        }
      }
    }

    // Delete managed roles
    await tx.userRole.deleteMany({
      where: {
        userId: targetUserId,
        role: { in: ["admin", "super_admin"] },
      },
    });

    // Nullify grantedBy references and updatedById references
    await tx.userRole.updateMany({
      where: { grantedBy: targetUserId },
      data: { grantedBy: null },
    });
    await tx.systemSetting.updateMany({
      where: { updatedById: targetUserId },
      data: { updatedById: null },
    });

    // If user has no remaining roles, attempt to delete AppUser
    const remainingRoles = await tx.userRole.count({ where: { userId: targetUserId } });
    let rowDeleted = false;
    if (remainingRoles === 0) {
      // A user with history (audit_log, loan_approval, ...) is still referenced, so PostgreSQL
      // refuses the DELETE and aborts the whole transaction. The savepoint keeps the transaction
      // alive: the row stays for the history and only the roles are removed.
      await tx.$executeRaw`SAVEPOINT delete_app_user`;
      try {
        await tx.appUser.delete({ where: { id: targetUserId } });
        rowDeleted = true;
        await tx.$executeRaw`RELEASE SAVEPOINT delete_app_user`;
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2003") {
          throw error;
        }
        await tx.$executeRaw`ROLLBACK TO SAVEPOINT delete_app_user`;
      }
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "user.deleted",
        entityType: "app_user",
        entityId: targetUserId,
        before: {
          email: target.email,
          fullNameTh: target.fullNameTh,
          roles: targetRoleNames,
        },
        after: { rowDeleted },
      },
    });

    return { success: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateManagedUser({
  actorId,
  targetUserId,
  email,
  fullNameTh,
  fullNameEn,
}: {
  actorId: string;
  targetUserId: string;
  email: string;
  fullNameTh: string;
  fullNameEn?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const target = await tx.appUser.findUnique({
      where: { id: targetUserId },
      select: superAdminUserSelect,
    });
    if (!target) throw new RoleMutationError("USER_NOT_FOUND");

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullNameTh = fullNameTh.trim();
    const cleanFullNameEn = fullNameEn ? fullNameEn.trim() : null;
    const cmuAccount = cleanEmail.split("@")[0];

    // Check email and cmuAccount collision (both are unique)
    const existingWithEmail = await tx.appUser.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { cmuAccount }],
        id: { not: targetUserId },
      },
    });
    if (existingWithEmail) {
      throw new RoleMutationError("EMAIL_ALREADY_IN_USE");
    }

    const updated = await tx.appUser.update({
      where: { id: targetUserId },
      data: {
        email: cleanEmail,
        cmuAccount,
        fullNameTh: cleanFullNameTh,
        fullNameEn: cleanFullNameEn,
      },
      select: superAdminUserSelect,
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "user.updated",
        entityType: "app_user",
        entityId: targetUserId,
        before: { email: target.email, fullNameTh: target.fullNameTh },
        after: { email: updated.email, fullNameTh: updated.fullNameTh },
      },
    });

    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getAllLoanRequest() {
  return prisma.loanRequest.findMany({ orderBy: { createdAt: "asc" } });
}

export async function syncUserFromCmuProfile(profile: CmuProfile) {
  let cmuAccount = "";
  if (typeof profile.cmuitaccount_name === "string" && profile.cmuitaccount_name.trim()) {
    cmuAccount = profile.cmuitaccount_name.trim().toLowerCase();
  } else if (typeof profile.cmuitaccount === "string" && profile.cmuitaccount.trim()) {
    cmuAccount = profile.cmuitaccount.trim().split("@")[0].toLowerCase();
  }

  let email = "";
  if (typeof profile.cmuitaccount === "string" && profile.cmuitaccount.includes("@")) {
    email = profile.cmuitaccount.trim().toLowerCase();
  } else if (typeof profile.email === "string" && profile.email.includes("@")) {
    email = profile.email.trim().toLowerCase();
  } else if (cmuAccount) {
    email = `${cmuAccount}@cmu.ac.th`;
  }

  let studentCode: string | null = null;
  const rawStudentId = profile.student_id ?? profile.studentCode ?? profile.studentId;
  if (typeof rawStudentId === "string" || typeof rawStudentId === "number") {
    const code = String(rawStudentId).trim();
    if (code) studentCode = code;
  }

  const thaiFirst = typeof profile.firstname_TH === "string" ? profile.firstname_TH.trim() : "";
  const thaiLast = typeof profile.lastname_TH === "string" ? profile.lastname_TH.trim() : "";
  const thaiName = [thaiFirst, thaiLast].filter(Boolean).join(" ");
  const fullNameTh =
    (typeof profile.full_name_TH === "string" && profile.full_name_TH.trim()) ||
    thaiName ||
    getCmuDisplayName(profile).trim() ||
    cmuAccount ||
    "CMU User";

  const engFirst = typeof profile.firstname_EN === "string" ? profile.firstname_EN.trim() : "";
  const engLast = typeof profile.lastname_EN === "string" ? profile.lastname_EN.trim() : "";
  const engName = [engFirst, engLast].filter(Boolean).join(" ");
  const fullNameEn =
    (typeof profile.full_name_EN === "string" && profile.full_name_EN.trim()) ||
    engName ||
    null;

  if (!cmuAccount && !email && !studentCode) {
    return null;
  }

  const existing = await prisma.appUser.findFirst({
    where: {
      OR: [
        ...(cmuAccount ? [{ cmuAccount }] : []),
        ...(email ? [{ email }] : []),
        ...(studentCode ? [{ studentCode }] : []),
      ],
    },
    include: {
      roles: {
        select: { role: true },
      },
    },
  });

  const isStudent = Boolean(
    studentCode ||
      profile.itaccounttype_id === "StdAcc" ||
      (typeof profile.itaccounttype_TH === "string" && profile.itaccounttype_TH.includes("นักศึกษา")),
  );

  if (existing) {
    const updated = await prisma.appUser.update({
      where: { id: existing.id },
      data: {
        cmuAccount: existing.cmuAccount || cmuAccount,
        email: existing.email || email,
        studentCode: existing.studentCode || studentCode,
        fullNameTh: fullNameTh || existing.fullNameTh,
        fullNameEn: fullNameEn ?? existing.fullNameEn,
      },
      include: {
        roles: {
          select: { role: true },
        },
      },
    });

    if (isStudent && !existing.roles.some((r) => r.role === UserRoleName.student)) {
      await prisma.userRole.upsert({
        where: { userId_role: { userId: existing.id, role: UserRoleName.student } },
        create: { userId: existing.id, role: UserRoleName.student },
        update: {},
      });
    }

    return updated;
  }

  return prisma.$transaction(async (tx) => {
    const newUser = await tx.appUser.create({
      data: {
        cmuAccount: cmuAccount || email.split("@")[0],
        email: email || `${cmuAccount}@cmu.ac.th`,
        studentCode,
        fullNameTh,
        fullNameEn,
      },
    });

    if (isStudent) {
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          role: UserRoleName.student,
        },
      });
    }

    return newUser;
  });
}

export async function listAdvisors() {
  return prisma.appUser.findMany({
    where: {
      roles: { some: { role: UserRoleName.advisor } },
    },
    select: {
      id: true,
      fullNameTh: true,
      fullNameEn: true,
    },
    orderBy: { fullNameTh: "asc" },
  });
}
