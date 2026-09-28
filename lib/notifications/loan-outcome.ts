import type {
  LoanOutcome,
  LoanOutcomeDedupeKey,
  LoanOutcomePayload,
} from "@/db/queries/notifications";

// Redeclared, not imported as a value, from db/queries/notifications - that module pulls in
// lib/prisma (throws without DATABASE_URL), and this file must stay importable in pure unit tests.
export const LOAN_OUTCOME_EVENT = "loan_outcome" as const;

export type { LoanOutcome, LoanOutcomeDedupeKey, LoanOutcomePayload };

export function buildLoanOutcomeDedupeKey(
  loanId: string,
  outcome: LoanOutcome,
): LoanOutcomeDedupeKey {
  return `loan-outcome:${loanId}:${outcome}`;
}

export function isLoanOutcomePayload(value: unknown): value is LoanOutcomePayload {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.loanId === "string" &&
    (record.outcome === "disbursed" || record.outcome === "rejected")
  );
}

export type ParsedLoanOutcomeRow =
  | { kind: "ok"; loanId: string; outcome: LoanOutcome }
  | { kind: "fail"; message: string };

export function parseLoanOutcomeRow(row: {
  eventType: string;
  payload: unknown;
}): ParsedLoanOutcomeRow {
  if (row.eventType !== LOAN_OUTCOME_EVENT) {
    return { kind: "fail", message: `unsupported eventType: ${row.eventType}` };
  }
  if (!isLoanOutcomePayload(row.payload)) {
    return { kind: "fail", message: "malformed payload" };
  }
  return { kind: "ok", loanId: row.payload.loanId, outcome: row.payload.outcome };
}

export type LoanForOutcomeDelivery = { status: string };

export type LoanOutcomeDecision<T extends LoanForOutcomeDelivery> =
  | { kind: "send"; loan: T }
  | { kind: "skip"; reason: string };

/** A disbursed loan may already be closed by the time the row is delivered - still worth telling
 *  the student the money was sent. A rejection is terminal, so its status never moves on. */
const STATUSES_FOR_OUTCOME: Record<LoanOutcome, readonly string[]> = {
  disbursed: ["disbursed", "closed"],
  rejected: ["rejected"],
};

export function decideLoanOutcomeDelivery<T extends LoanForOutcomeDelivery>(
  loan: T | null,
  outcome: LoanOutcome,
): LoanOutcomeDecision<T> {
  if (!loan) return { kind: "skip", reason: "loan request no longer exists" };
  if (!STATUSES_FOR_OUTCOME[outcome].includes(loan.status)) {
    return { kind: "skip", reason: `loan status ${loan.status} does not match outcome ${outcome}` };
  }
  return { kind: "send", loan };
}
