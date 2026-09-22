const MAX_MONEY_AMOUNT = 2_147_483_647;

export type LoanInput = {
  advisorName: string;
  amount: number;
  studentYear: number;
  purpose: string;
  additionalNote: string | null;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  installmentCount: number;
};

export type LoanDecision = "approved" | "returned" | "rejected";

export type LoanDecisionInput = {
  decision: LoanDecision;
  comment: string | null;
};

export type ExecutiveDecision = LoanDecision;

export type ExecutiveDecisionInput = LoanDecisionInput;

export type AdminDecisionInput = LoanDecisionInput & {
  approvedAmount: number | null;
};

function requiredText(value: unknown, field: string, maxLength = 500) {
  if (typeof value !== "string") throw new Error(`${field} is required`);
  const text = value.trim();
  if (!text || text.length > maxLength) throw new Error(`${field} is invalid`);
  return text;
}

function parseAmount(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    value > MAX_MONEY_AMOUNT
  ) {
    throw new Error("amount is invalid");
  }
  return value;
}

function parseStudentYear(value: unknown) {
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 4) {
    throw new Error("studentYear is invalid");
  }
  return value as number;
}

function optionalText(value: unknown, field: string, maxLength = 500) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error(`${field} is invalid`);
  const text = value.trim();
  if (text.length > maxLength) throw new Error(`${field} is invalid`);
  return text || null;
}

export function parseLoanInput(value: unknown): LoanInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("request body is invalid");
  }

  const input = value as Record<string, unknown>;
  const installmentCount = input.installmentCount;
  if (
    !Number.isInteger(installmentCount) ||
    (installmentCount as number) < 1 ||
    (installmentCount as number) > 3
  ) {
    throw new Error("installmentCount is invalid");
  }

  return {
    advisorName: requiredText(input.advisorName, "advisorName", 200),
    amount: parseAmount(input.amount),
    studentYear: parseStudentYear(input.studentYear),
    purpose: requiredText(input.purpose, "purpose", 2000),
    additionalNote: optionalText(input.additionalNote, "additionalNote", 2000),
    bankName: requiredText(input.bankName, "bankName", 200),
    bankAccountNo: requiredText(input.bankAccountNo, "bankAccountNo", 50),
    bankAccountName: requiredText(input.bankAccountName, "bankAccountName", 200),
    installmentCount: installmentCount as number,
  };
}

function parseDecision(value: unknown): LoanDecision {
  if (value === "approved" || value === "returned" || value === "rejected") return value;
  throw new Error("decision is invalid");
}

function parseDecisionComment(value: unknown, decision: LoanDecision) {
  if (value !== undefined && value !== null && typeof value !== "string") {
    throw new Error("comment is invalid");
  }

  const comment = typeof value === "string" ? value.trim() : "";
  if (comment.length > 2000) throw new Error("comment is invalid");
  if ((decision === "returned" || decision === "rejected") && !comment) {
    throw new Error("A comment is required for this decision");
  }

  return comment || null;
}

export function parseLoanDecisionInput(value: unknown): LoanDecisionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("request body is invalid");
  }

  const input = value as Record<string, unknown>;
  const decision = parseDecision(input.decision);
  return { decision, comment: parseDecisionComment(input.comment, decision) };
}

export function parseAdminDecisionInput(value: unknown): AdminDecisionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("request body is invalid");
  }

  const input = value as Record<string, unknown>;
  const decision = parseDecision(input.decision);
  const comment = parseDecisionComment(input.comment, decision);

  if (decision !== "approved") {
    if (Object.hasOwn(input, "approvedAmount")) {
      throw new Error("approvedAmount is only allowed for approval");
    }
    return { decision, approvedAmount: null, comment };
  }

  const approvedAmount = input.approvedAmount;
  if (
    typeof approvedAmount !== "number" ||
    !Number.isSafeInteger(approvedAmount) ||
    approvedAmount <= 0 ||
    approvedAmount > MAX_MONEY_AMOUNT
  ) {
    throw new Error("approvedAmount is invalid");
  }

  return { decision, approvedAmount, comment };
}

export const parseExecutiveDecisionInput = parseLoanDecisionInput;

export function parsePhoneNumber(value: unknown) {
  if (typeof value !== "string") throw new Error("phoneNumber is invalid");
  const cleaned = value.trim().replace(/[-\s]/g, "");
  if (!/^0(?:[689]\d{8}|[23457]\d{7})$/.test(cleaned)) throw new Error("phoneNumber is invalid");
  return cleaned;
}

export type InstallmentScheduleEntry = {
  seq: number;
  dueDate: Date;
  amountDue: number;
};

function addDays(date: Date, days: number): Date {
  // ponytail: UTC-based arithmetic - firstDueDate is a DATE column (midnight UTC); using
  // local-time Date methods here would drift a day depending on the server's timezone.
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Whole-baht even split of approvedAmount across installmentCount installments, with the last
 * installment absorbing whatever remainder floor() dropped so the sum always equals
 * approvedAmount exactly. Pure function - no DB access - so it is unit-testable on its own.
 */
export function computeInstallmentSchedule(
  approvedAmount: number,
  installmentCount: number,
  firstDueDate: Date,
): InstallmentScheduleEntry[] {
  const base = Math.floor(approvedAmount / installmentCount);
  return Array.from({ length: installmentCount }, (_, index) => {
    const seq = index + 1;
    const isLast = seq === installmentCount;
    return {
      seq,
      dueDate: addDays(firstDueDate, 30 * (seq - 1)),
      amountDue: isLast ? approvedAmount - base * (installmentCount - 1) : base,
    };
  });
}

export type StudentPaymentInput = {
  amount: number;
  paidAt: Date | null;
};

/**
 * Parses the non-file half of a repayment submission. Values arrive as multipart form fields, so
 * every one is a string here - not JSON-typed like every other parser in this file.
 */
export function parseStudentPaymentInput(input: {
  amount: unknown;
  paidAt?: unknown;
}): StudentPaymentInput {
  const raw = typeof input.amount === "string" ? input.amount.trim() : input.amount;
  const amount = typeof raw === "string" && raw !== "" ? Number(raw) : NaN;
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_MONEY_AMOUNT) {
    throw new Error("amount is invalid");
  }

  if (input.paidAt === undefined || input.paidAt === null || input.paidAt === "") {
    return { amount, paidAt: null };
  }
  if (typeof input.paidAt !== "string") throw new Error("paidAt is invalid");
  const paidAt = new Date(input.paidAt);
  if (Number.isNaN(paidAt.getTime())) throw new Error("paidAt is invalid");
  // A transfer cannot have happened in the future; a wrong date here would misreport a late
  // payment as on time once conduct is derived from it.
  if (paidAt.getTime() > Date.now()) throw new Error("paidAt cannot be in the future");

  return { amount, paidAt };
}

export type PaymentDecision = "confirmed" | "rejected";

export type PaymentDecisionInput = {
  decision: PaymentDecision;
  note: string | null;
};

export function parsePaymentDecisionInput(value: unknown): PaymentDecisionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("request body is invalid");
  }

  const input = value as Record<string, unknown>;
  if (input.decision !== "confirmed" && input.decision !== "rejected") {
    throw new Error("decision is invalid");
  }
  const decision = input.decision;

  const note = optionalText(input.note, "note", 2000);
  // Same rule as a returned/rejected loan decision: any negative outcome states its reason, so the
  // student is told what to fix before submitting a new slip.
  if (decision === "rejected" && !note) {
    throw new Error("A note is required when rejecting a payment");
  }

  return { decision, note };
}

export type PaymentAllocationTarget = {
  id: bigint;
  seq: number;
  amountDue: number;
  amountPaid: number;
};

export type PaymentAllocationEntry = {
  id: bigint;
  amountPaid: number;
  settled: boolean;
};

export type PaymentAllocation = {
  allocations: PaymentAllocationEntry[];
  surplus: number;
  outstandingAfter: number;
  closesLoan: boolean;
};

/**
 * Spreads a confirmed payment across the still-unsettled installments, filling each to its due
 * amount in this order: the oldest, then the last, then the rest ascending. Paying past the final
 * installment leaves a surplus - the fund is still credited the full payment and the excess is
 * reconciled by hand outside the system. amountDue is never rewritten, so the original schedule
 * stays auditable and `amountDue - amountPaid` keeps working as the remaining balance.
 * Pure function - no DB access - so it is unit-testable on its own.
 */
export function allocatePayment(
  unsettled: PaymentAllocationTarget[],
  paymentAmount: number,
): PaymentAllocation {
  const ordered = [...unsettled].sort((a, b) => a.seq - b.seq);
  // slice(1, -1) drops both ends, so a single installment is never targeted twice.
  const targets =
    ordered.length > 1
      ? [ordered[0], ordered[ordered.length - 1], ...ordered.slice(1, -1)]
      : ordered;

  const allocations: PaymentAllocationEntry[] = [];
  let left = Math.max(paymentAmount, 0);
  let outstandingAfter = 0;

  for (const target of targets) {
    // Clamped: an overpaid row would otherwise hand negative "remaining" back to the pool and
    // inflate every later allocation.
    const remaining = Math.max(target.amountDue - target.amountPaid, 0);
    const applied = Math.min(remaining, left);
    left -= applied;
    outstandingAfter += remaining - applied;
    if (applied > 0) {
      allocations.push({
        id: target.id,
        amountPaid: target.amountPaid + applied,
        settled: applied === remaining,
      });
    }
  }

  return { allocations, surplus: left, outstandingAfter, closesLoan: outstandingAfter === 0 };
}

export type FundTransactionKindInput =
  "top_up" | "withdrawal" | "credit_adjustment" | "debit_adjustment";

export type FundTransactionInput = {
  kind: FundTransactionKindInput;
  amount: number;
  note: string | null;
};

const FUND_TRANSACTION_KINDS: FundTransactionKindInput[] = [
  "top_up",
  "withdrawal",
  "credit_adjustment",
  "debit_adjustment",
];

export function parseFundTransactionInput(value: unknown): FundTransactionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("request body is invalid");
  }

  const input = value as Record<string, unknown>;
  if (
    typeof input.kind !== "string" ||
    !FUND_TRANSACTION_KINDS.includes(input.kind as FundTransactionKindInput)
  ) {
    throw new Error("kind is invalid");
  }
  const kind = input.kind as FundTransactionKindInput;
  const amount = parseAmount(input.amount);
  const note = optionalText(input.note, "note", 2000);
  if (kind !== "top_up" && !note) {
    throw new Error("note is required for this transaction kind");
  }

  return { kind, amount, note };
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export type SystemSettingPatch = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  contactLocationTh?: string;
  contactLocationEn?: string | null;
  contactPhone?: string;
  contactExt?: string | null;
  contactEmail?: string;
};

// A display string, not a dialable mobile - keep separators as typed. Do not reuse
// parsePhoneNumber, which strips them and would rewrite the displayed office number.
const CONTACT_PHONE_PATTERN = /^[0-9+\-\s()]+$/;
const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseContactPhone(value: unknown) {
  const phone = requiredText(value, "contactPhone", 32);
  if (!CONTACT_PHONE_PATTERN.test(phone)) throw new Error("contactPhone is invalid");
  return phone;
}

function parseContactEmail(value: unknown) {
  const email = requiredText(value, "contactEmail", 254);
  if (!CONTACT_EMAIL_PATTERN.test(email)) throw new Error("contactEmail is invalid");
  return email;
}

export function parseSystemSettingPatch(value: unknown): SystemSettingPatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("request body is invalid");
  }

  const input = value as Record<string, unknown>;
  const patch: SystemSettingPatch = {};

  if ("bankName" in input) patch.bankName = requiredText(input.bankName, "bankName", 200);
  if ("accountName" in input) {
    patch.accountName = requiredText(input.accountName, "accountName", 200);
  }
  if ("accountNumber" in input) {
    patch.accountNumber = requiredText(input.accountNumber, "accountNumber", 50);
  }
  if ("contactLocationTh" in input) {
    patch.contactLocationTh = requiredText(input.contactLocationTh, "contactLocationTh", 500);
  }
  if ("contactLocationEn" in input) {
    patch.contactLocationEn = optionalText(input.contactLocationEn, "contactLocationEn", 500);
  }
  if ("contactPhone" in input) patch.contactPhone = parseContactPhone(input.contactPhone);
  if ("contactExt" in input) patch.contactExt = optionalText(input.contactExt, "contactExt", 50);
  if ("contactEmail" in input) patch.contactEmail = parseContactEmail(input.contactEmail);

  if (Object.keys(patch).length === 0) {
    throw new Error("at least one field is required");
  }

  return patch;
}

export type AdminLoanQueueStatus = "pending_admin" | "pending_disbursement";

export function parseAdminLoanQueueStatus(value: string | null): AdminLoanQueueStatus {
  if (value === null || value === "pending_admin") return "pending_admin";
  if (value === "pending_disbursement") return "pending_disbursement";
  throw new Error("status is invalid");
}

export function isLoanId(value: string) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return isUuid(trimmed) || /^REQ[A-Za-z0-9_-]+$/i.test(trimmed);
}
