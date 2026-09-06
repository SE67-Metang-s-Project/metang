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

export type ExecutiveDecision = "approved" | "rejected";

export type ExecutiveDecisionInput = {
  decision: ExecutiveDecision;
  comment: string | null;
};

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

export function parseExecutiveDecisionInput(value: unknown): ExecutiveDecisionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("request body is invalid");
  }

  const input = value as Record<string, unknown>;
  if (input.decision !== "approved" && input.decision !== "rejected") {
    throw new Error("decision is invalid");
  }

  const decision = input.decision as ExecutiveDecision;
  return { decision, comment: parseDecisionComment(input.comment, decision) };
}

export function parsePhoneNumber(value: unknown) {
  if (typeof value !== "string") throw new Error("phoneNumber is invalid");
  const cleaned = value.trim().replace(/[-\s]/g, "");
  if (!/^0(?:[689]\d{8}|[23457]\d{7})$/.test(cleaned)) throw new Error("phoneNumber is invalid");
  return cleaned;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isLoanId(value: string) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return isUuid(trimmed) || /^REQ[A-Za-z0-9_-]+$/i.test(trimmed);
}
