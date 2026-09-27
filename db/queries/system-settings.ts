import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { SystemSettingPatch } from "@/lib/loan-validation";

// System-wide bank + contact display, read by every signed-in user, written by SuperAdmin only.
// Standalone table: no relation to LoanRequest, Payment, or FundTransaction. Singleton row, id
// always 1 - see the CHECK constraint in db/migrations/<ts>_system_setting/migration.sql.

export const systemSettingSelect = {
  bankName: true,
  accountName: true,
  accountNumber: true,
  contactLocationTh: true,
  contactLocationEn: true,
  contactPhone: true,
  contactExt: true,
  contactEmail: true,
  updatedById: true,
  updatedAt: true,
} satisfies Prisma.SystemSettingSelect;

// Everyone-facing: no editor identity, no timestamps. Enforced by the select, not by the caller.
export const systemSettingPublicSelect = {
  bankName: true,
  accountName: true,
  accountNumber: true,
  contactLocationTh: true,
  contactLocationEn: true,
  contactPhone: true,
  contactExt: true,
  contactEmail: true,
} satisfies Prisma.SystemSettingSelect;

export async function getSystemSetting() {
  return prisma.systemSetting.findUnique({ where: { id: 1 }, select: systemSettingSelect });
}

export async function getPublicSystemSetting() {
  return prisma.systemSetting.findUnique({ where: { id: 1 }, select: systemSettingPublicSelect });
}

export type SystemSettingErrorCode = "ACCESS_REVOKED" | "NOT_INITIALIZED";

export class SystemSettingError extends Error {
  constructor(readonly code: SystemSettingErrorCode) {
    super(code);
  }
}

type EditableFields = Prisma.SystemSettingGetPayload<{ select: typeof systemSettingPublicSelect }>;

// AuditLog.before/after are Json, and Prisma's InputJsonValue rejects Date - so audit only the
// editable string columns, never updatedById/updatedAt/createdAt.
function pickEditable(row: EditableFields) {
  return {
    bankName: row.bankName,
    accountName: row.accountName,
    accountNumber: row.accountNumber,
    contactLocationTh: row.contactLocationTh,
    contactLocationEn: row.contactLocationEn,
    contactPhone: row.contactPhone,
    contactExt: row.contactExt,
    contactEmail: row.contactEmail,
  };
}

export async function updateSystemSetting({
  actorId,
  patch,
}: {
  actorId: string;
  patch: SystemSettingPatch;
}) {
  return prisma.$transaction(async (tx) => {
    // TOCTOU guard, same as createFundTransaction: the role can be revoked mid-request.
    const role = await tx.userRole.findFirst({
      where: { userId: actorId, role: "super_admin" },
      select: { userId: true },
    });
    if (!role) throw new SystemSettingError("ACCESS_REVOKED");

    const before = await tx.systemSetting.findUnique({
      where: { id: 1 },
      select: systemSettingPublicSelect,
    });
    if (!before) throw new SystemSettingError("NOT_INITIALIZED");

    const after = await tx.systemSetting.update({
      where: { id: 1 },
      data: { ...patch, updatedById: actorId },
      select: systemSettingSelect,
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "system_setting.updated",
        entityType: "system_setting",
        entityId: "1",
        before,
        after: pickEditable(after),
      },
    });

    return after;
  });
}
