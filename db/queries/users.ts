import { prisma } from "@/lib/prisma";
import { Prisma, UserRoleName, type LoanStatus } from "@/lib/generated/prisma/client";
import { getCmuNames, type CmuProfile } from "@/lib/cmu-auth";
import { holdsAdminAccess } from "@/lib/role-management";
import type { TxClient } from "@/db/queries/notifications";

export const superAdminUserSelect = {
  id: true,
  email: true,
  cmuAccount: true,
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

/** The settings page only manages these roles; students and advisors never leave the server. */
export async function listStaffWithRoles() {
  return prisma.appUser.findMany({
    where: { roles: { some: { role: { in: ["admin", "super_admin", "executive"] } } } },
    select: superAdminUserSelect,
    orderBy: [{ fullNameTh: "asc" }, { id: "asc" }],
  });
}

export type RoleMutationErrorCode =
  | "USER_NOT_FOUND"
  | "ROLE_ALREADY_GRANTED"
  | "ROLE_NOT_GRANTED"
  | "FINAL_SUPER_ADMIN"
  | "SELF_DEMOTION"
  | "EXECUTIVE_ALREADY_EXISTS"
  | "EXECUTIVE_ROLE_LOCKED"
  | "EMAIL_ALREADY_IN_USE"
  | "EXECUTIVE_CANNOT_BE_DELETED"
  | "NOT_EXECUTIVE"
  | "NOT_MANAGED_USER"
  | "REASSIGNMENT_CONFLICT";

export class RoleMutationError extends Error {
  constructor(readonly code: RoleMutationErrorCode) {
    super(code);
  }
}

const userMutationOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 15_000,
};

/**
 * "You remove me, you do my work": once a user holds neither admin nor super_admin, their open
 * admin-step loans move to the SuperAdmin who removed them, one audit row per loan. A user who
 * still holds either role keeps their loans.
 */
async function reassignOpenAdminLoans(
  tx: TxClient,
  { actorId, targetUserId, remainingRoles }: { actorId: string; targetUserId: string; remainingRoles: UserRoleName[] },
) {
  if (holdsAdminAccess(remainingRoles)) return;
  const where = {
    assignedAdminId: targetUserId,
    status: { in: ["pending_admin", "pending_executive"] as LoanStatus[] },
  };
  const openLoans = await tx.loanRequest.findMany({ where, select: { id: true, status: true } });
  const reassigned = await tx.loanRequest.updateMany({ where, data: { assignedAdminId: actorId } });
  if (reassigned.count !== openLoans.length) throw new RoleMutationError("REASSIGNMENT_CONFLICT");
  for (const loan of openLoans) {
    await tx.auditLog.create({
      data: {
        actorId,
        action: "loan_request.admin_reassigned",
        entityType: "loan_request",
        entityId: loan.id,
        before: { assignedAdminId: targetUserId, status: loan.status },
        after: { assignedAdminId: actorId, status: loan.status },
      },
    });
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
      // The executive is replaced through editExecutive, never removed, so there is always one.
      if (role === "executive") throw new RoleMutationError("EXECUTIVE_ROLE_LOCKED");
      if (role === "super_admin") {
        // A SuperAdmin who wants out promotes a successor, and the successor removes them.
        if (targetUserId === actorId) throw new RoleMutationError("SELF_DEMOTION");
        const superAdminCount = await tx.userRole.count({ where: { role: "super_admin" } });
        if (superAdminCount <= 1) throw new RoleMutationError("FINAL_SUPER_ADMIN");
      }
      await tx.userRole.delete({ where: { userId_role: { userId: targetUserId, role } } });
      await reassignOpenAdminLoans(tx, {
        actorId,
        targetUserId,
        remainingRoles: beforeRoles.filter((currentRole) => currentRole !== role),
      });
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
  }, userMutationOptions);
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
  }, userMutationOptions);
}

/**
 * Removes a staff member: takes away their admin and super_admin roles and hands their open loans
 * to the actor. The app_user row stays - their approvals, payouts and audit rows point at it, and
 * those must keep naming who did the work. With no managed role left they drop off the staff list.
 */
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
    if (targetUserId === actorId) throw new RoleMutationError("SELF_DEMOTION");

    const beforeRoles = target.roles.map((r) => r.role);
    if (beforeRoles.includes("executive")) throw new RoleMutationError("EXECUTIVE_CANNOT_BE_DELETED");
    if (!holdsAdminAccess(beforeRoles)) throw new RoleMutationError("NOT_MANAGED_USER");

    if (beforeRoles.includes("super_admin")) {
      const superAdminCount = await tx.userRole.count({ where: { role: "super_admin" } });
      if (superAdminCount <= 1) throw new RoleMutationError("FINAL_SUPER_ADMIN");
    }

    await tx.userRole.deleteMany({
      where: { userId: targetUserId, role: { in: ["admin", "super_admin"] } },
    });
    const remainingRoles = beforeRoles.filter((role) => role !== "admin" && role !== "super_admin");
    await reassignOpenAdminLoans(tx, { actorId, targetUserId, remainingRoles });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "user.deleted",
        entityType: "app_user",
        entityId: targetUserId,
        before: { email: target.email, fullNameTh: target.fullNameTh, roles: beforeRoles },
        after: { roles: remainingRoles },
      },
    });

    return { success: true };
  }, userMutationOptions);
}

/**
 * Edits the executive. Same email: fixes the names in place. New email: hands the executive role
 * to a new person created from it, and the previous executive keeps their row, other roles and
 * history, so past executive decisions still carry their name. An email (or CMU account) that
 * already belongs to another user is refused: the role is never handed to an existing account.
 */
export async function editExecutive({
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
    if (!target.roles.some((r) => r.role === "executive")) throw new RoleMutationError("NOT_EXECUTIVE");

    const cleanEmail = email.trim().toLowerCase();
    const cmuAccount = cleanEmail.split("@")[0];
    const names = { fullNameTh: fullNameTh.trim(), fullNameEn: fullNameEn?.trim() || null };

    // Both columns are unique, so either one belonging to someone else blocks the change.
    const taken = await tx.appUser.findFirst({
      where: { OR: [{ email: cleanEmail }, { cmuAccount }], id: { not: targetUserId } },
      select: { id: true },
    });
    if (taken) throw new RoleMutationError("EMAIL_ALREADY_IN_USE");

    // Same person (same email, or their own account): fix the details in place.
    if (target.email?.toLowerCase() === cleanEmail || target.cmuAccount === cmuAccount) {
      const updated = await tx.appUser.update({
        where: { id: targetUserId },
        data: { email: cleanEmail, cmuAccount, ...names },
        select: superAdminUserSelect,
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "user.updated",
          entityType: "app_user",
          entityId: targetUserId,
          before: { email: target.email, fullNameTh: target.fullNameTh, fullNameEn: target.fullNameEn },
          after: { email: updated.email, fullNameTh: updated.fullNameTh, fullNameEn: updated.fullNameEn },
        },
      });
      return updated;
    }

    // Hand over: a new person, created from the new email, becomes the executive.
    const successorId = (
      await tx.appUser.create({
        data: { email: cleanEmail, cmuAccount, ...names },
        select: { id: true },
      })
    ).id;
    await tx.userRole.delete({ where: { userId_role: { userId: targetUserId, role: "executive" } } });
    await tx.userRole.create({ data: { userId: successorId, role: "executive", grantedBy: actorId } });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "executive.handed_over",
        entityType: "app_user",
        entityId: successorId,
        before: { executiveId: targetUserId, email: target.email },
        after: { executiveId: successorId, email: cleanEmail },
      },
    });

    return tx.appUser.findUniqueOrThrow({ where: { id: successorId }, select: superAdminUserSelect });
  }, userMutationOptions);
}

export async function getAllLoanRequest() {
  return prisma.loanRequest.findMany({ orderBy: { createdAt: "asc" } });
}

/**
 * Refreshes a staff member's names from their CMU profile at sign-in. Only existing rows are
 * touched: staff are added by a SuperAdmin, and students never get an app_user row (a loan request
 * carries the borrower's identity itself).
 */
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

  if (!cmuAccount && !email) return null;

  const existing = await prisma.appUser.findFirst({
    where: { OR: [...(cmuAccount ? [{ cmuAccount }] : []), ...(email ? [{ email }] : [])] },
    select: { id: true, cmuAccount: true, email: true, fullNameEn: true },
  });
  if (!existing) return null;

  const { fullNameTh, fullNameEn } = getCmuNames(profile);
  return prisma.appUser.update({
    where: { id: existing.id },
    data: {
      cmuAccount: existing.cmuAccount || cmuAccount,
      email: existing.email || email,
      fullNameTh,
      fullNameEn: fullNameEn ?? existing.fullNameEn,
    },
    include: { roles: { select: { role: true } } },
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
