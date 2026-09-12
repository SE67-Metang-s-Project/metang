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
