import { prisma } from "@/lib/prisma";
import { Prisma, type UserRoleName } from "@/lib/generated/prisma/client";

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
  | "FINAL_SUPER_ADMIN";

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
      await tx.userRole.create({ data: { userId: targetUserId, role, grantedBy: actorId } });
    } else {
      if (!hasRole) throw new RoleMutationError("ROLE_NOT_GRANTED");
      if (role === "super_admin") {
        const superAdminCount = await tx.userRole.count({ where: { role: "super_admin" } });
        if (superAdminCount <= 1) throw new RoleMutationError("FINAL_SUPER_ADMIN");
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

export async function getAllStudents() {
  return prisma.appUser.findMany({
    where: { studentCode: { not: null } },
    orderBy: { fullNameTh: "asc" },
    select: {
      id: true,
      studentCode: true,
      fullNameTh: true,
    },
  });
}

export async function getAllLoanRequest() {
  return prisma.loanRequest.findMany({ orderBy: { createdAt: "asc" } });
}
