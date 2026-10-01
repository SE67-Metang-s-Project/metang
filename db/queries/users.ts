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
  | "EXECUTIVE_ADVISOR_LOCKED"
  | "EMAIL_ALREADY_IN_USE"
  | "EXECUTIVE_CANNOT_BE_DELETED"
  | "NOT_EXECUTIVE"
  | "NOT_MANAGED_USER"
  | "REASSIGNMENT_CONFLICT"
  | "ACCESS_REVOKED"
  | "ADVISOR_ADMIN_CONFLICT";

export class RoleMutationError extends Error {
  constructor(readonly code: RoleMutationErrorCode) {
    super(code);
  }
}

/**
 * TOCTOU guard for every staff mutation: the caller's super_admin role can be removed (or their
 * row deleted) between the route's access check and this transaction. audit_log.actor_id has no
 * FK, so without this an ex-SuperAdmin could still act and log under a deleted id.
 */
async function assertActorIsSuperAdmin(tx: TxClient, actorId: string) {
  const role = await tx.userRole.findFirst({
    where: { userId: actorId, role: "super_admin" },
    select: { userId: true },
  });
  if (!role) throw new RoleMutationError("ACCESS_REVOKED");
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

/** Comment on the advisor approval closed by cancelOpenAdvisorLoans; the timeline shows it. */
export const ADVISOR_REMOVED_COMMENT = "ยกเลิกคำร้องอัตโนมัติ: อาจารย์ที่ปรึกษาถูกถอดออกจากระบบ";

/**
 * Removing an advisor cancels the loans only they could move: pending_advisor. Loans past the
 * advisor step stay - no later step sends a loan back to the advisor. The student applies again
 * with another advisor. Each pending advisor approval is closed as rejected by the actor, because
 * loan_approval's CHECK needs decided_by and decided_at on any row that is not pending.
 */
async function cancelOpenAdvisorLoans(tx: TxClient, { actorId, targetUserId }: { actorId: string; targetUserId: string }) {
  const where = { advisorId: targetUserId, status: "pending_advisor" as LoanStatus };
  const openLoans = await tx.loanRequest.findMany({ where, select: { id: true } });
  if (openLoans.length === 0) return;

  const cancelledAt = new Date();
  const cancelled = await tx.loanRequest.updateMany({ where, data: { status: "cancelled", cancelledAt } });
  if (cancelled.count !== openLoans.length) throw new RoleMutationError("REASSIGNMENT_CONFLICT");

  const loanIds = openLoans.map((loan) => loan.id);
  await tx.loanApproval.updateMany({
    where: { loanId: { in: loanIds }, step: "advisor", decision: "pending" },
    data: { decision: "rejected", decidedBy: actorId, decidedAt: cancelledAt, comment: ADVISOR_REMOVED_COMMENT },
  });
  // No enqueueReviewerNotifications: cancelled has no reviewer step, so it would enqueue nothing.
  for (const loanId of loanIds) {
    await tx.auditLog.create({
      data: {
        actorId,
        action: "loan_request.cancelled",
        entityType: "loan_request",
        entityId: loanId,
        before: { status: "pending_advisor", advisorId: targetUserId },
        after: { status: "cancelled", reason: "advisor_removed" },
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
    await assertActorIsSuperAdmin(tx, actorId);
    const target = await tx.appUser.findUnique({
      where: { id: targetUserId },
      select: superAdminUserSelect,
    });
    if (!target) throw new RoleMutationError("USER_NOT_FOUND");

    const beforeRoles = target.roles.map(({ role: currentRole }) => currentRole);
    const hasRole = beforeRoles.includes(role);

    if (action === "grant") {
      if (hasRole) throw new RoleMutationError("ROLE_ALREADY_GRANTED");
      // An advisor is never also admin or super_admin, either way round: no one approves a loan
      // as advisor and again as admin.
      const staffRole = (r: UserRoleName) => r === "admin" || r === "super_admin";
      if ((role === "advisor" && beforeRoles.some(staffRole)) || (staffRole(role) && beforeRoles.includes("advisor"))) {
        throw new RoleMutationError("ADVISOR_ADMIN_CONFLICT");
      }
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
      // The executive also advises students, so they keep advisor while they are the executive.
      if (role === "advisor" && beforeRoles.includes("executive")) {
        throw new RoleMutationError("EXECUTIVE_ADVISOR_LOCKED");
      }
      if (role === "super_admin") {
        // A SuperAdmin who wants out promotes a successor, and the successor removes them.
        if (targetUserId === actorId) throw new RoleMutationError("SELF_DEMOTION");
        const superAdminCount = await tx.userRole.count({ where: { role: "super_admin" } });
        if (superAdminCount <= 1) throw new RoleMutationError("FINAL_SUPER_ADMIN");
      }
      await tx.userRole.delete({ where: { userId_role: { userId: targetUserId, role } } });
      if (role === "advisor") await cancelOpenAdvisorLoans(tx, { actorId, targetUserId });
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
    await assertActorIsSuperAdmin(tx, actorId);
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullNameTh = fullNameTh.trim();
    const cleanFullNameEn = fullNameEn ? fullNameEn.trim() : null;
    const cmuAccount = cleanEmail.split("@")[0];

    // Add never renames anyone or hands a role to someone who holds one (staff, advisor, the
    // executive): they are refused. A removed staff member whose row stays for history (no roles
    // left) is rehired on that same row, so their past work and new work share one id; their
    // names stay as recorded.
    const existing = await tx.appUser.findFirst({
      where: { OR: [{ email: cleanEmail }, { cmuAccount }] },
      select: { id: true, roles: { select: { role: true } } },
    });
    if (existing && existing.roles.length > 0) throw new RoleMutationError("EMAIL_ALREADY_IN_USE");

    if (existing) {
      await tx.userRole.create({ data: { userId: existing.id, role, grantedBy: actorId } });
      await tx.auditLog.create({
        data: {
          actorId,
          action: "user_role.granted",
          entityType: "app_user",
          entityId: existing.id,
          before: { roles: [] },
          after: { roles: [role], rehired: true },
        },
      });
      const rehired = await tx.appUser.findUnique({ where: { id: existing.id }, select: superAdminUserSelect });
      if (!rehired) throw new RoleMutationError("USER_NOT_FOUND");
      return rehired;
    }

    const newUser = await tx.appUser.create({
      data: {
        email: cleanEmail,
        cmuAccount,
        fullNameTh: cleanFullNameTh,
        fullNameEn: cleanFullNameEn,
      },
    });

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

    const created = await tx.appUser.findUnique({
      where: { id: newUser.id },
      select: superAdminUserSelect,
    });
    if (!created) throw new RoleMutationError("USER_NOT_FOUND");
    return created;
  }, userMutationOptions);
}

/**
 * Removes a staff member: hands their open loans to the actor, then deletes their app_user row.
 * The row stays (only admin and super_admin are taken away) while it is still needed: they hold
 * another role (advisor), or a loan, approval, payment or ledger row names them - those must keep
 * naming who did the work. audit_log has no FK to app_user, so it never blocks the delete; the
 * user.deleted row records who the uuid was.
 */
export async function deleteManagedUser({
  actorId,
  targetUserId,
}: {
  actorId: string;
  targetUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    await assertActorIsSuperAdmin(tx, actorId);
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

    const remainingRoles = beforeRoles.filter((role) => role !== "admin" && role !== "super_admin");
    await reassignOpenAdminLoans(tx, { actorId, targetUserId, remainingRoles });

    // ponytail: mirrors the NoAction FKs to app_user. A new one must be added here, or deleting
    // anyone it names fails with P2003 (500) instead of keeping the row.
    const named =
      remainingRoles.length > 0 ||
      (await tx.loanRequest.count({
        where: { OR: [{ advisorId: targetUserId }, { assignedAdminId: targetUserId }] },
      })) > 0 ||
      (await tx.loanApproval.count({ where: { decidedBy: targetUserId } })) > 0 ||
      (await tx.payment.count({ where: { confirmedBy: targetUserId } })) > 0 ||
      (await tx.fundTransaction.count({ where: { performedBy: targetUserId } })) > 0;

    if (named) {
      await tx.userRole.deleteMany({
        where: { userId: targetUserId, role: { in: ["admin", "super_admin"] } },
      });
    } else {
      // user_role cascades; user_role.granted_by and system_setting.updated_by_id are SET NULL.
      await tx.appUser.delete({ where: { id: targetUserId } });
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "user.deleted",
        entityType: "app_user",
        entityId: targetUserId,
        before: { email: target.email, fullNameTh: target.fullNameTh, roles: beforeRoles },
        after: { roles: remainingRoles, rowDeleted: !named },
      },
    });

    return { success: true, rowDeleted: !named };
  }, userMutationOptions);
}

/**
 * Edits the executive in place: names, email and CMU account change on the same app_user row.
 * A new email means a new person takes over the post, but every foreign key (approvals, audit
 * rows, advisor_id, the executive and advisor roles) points at the row id, so it all carries over
 * and no second row is made. Past executive decisions then show the new name. An email (or CMU
 * account) that already belongs to another user is refused.
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
    await assertActorIsSuperAdmin(tx, actorId);
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
        before: {
          email: target.email,
          cmuAccount: target.cmuAccount,
          fullNameTh: target.fullNameTh,
          fullNameEn: target.fullNameEn,
        },
        after: {
          email: updated.email,
          cmuAccount: updated.cmuAccount,
          fullNameTh: updated.fullNameTh,
          fullNameEn: updated.fullNameEn,
        },
      },
    });
    return updated;
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
