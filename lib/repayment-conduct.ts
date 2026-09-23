import { bangkokDateKey } from "@/lib/date";
import { allocatePayment, type PaymentAllocationTarget } from "@/lib/loan-validation";

export type ConductInstallment = {
  seq: number;
  dueDate: string | Date;
  amountDue: number;
  amountPaid: number;
  settledAt?: string | Date | null;
};

export type ConductPayment = {
  status: string;
  amount: number;
  paidAt?: string | Date | null;
  confirmedAt?: string | Date | null;
  createdAt?: string | Date | null;
};

/** null: not counted yet (unsettled and not yet due). */
export type InstallmentConduct = "on_time" | "late" | null;

function time(value: string | Date | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

/**
 * On time or late per installment (same order as `installments`), derived from repayment history.
 *
 * Not from settledAt: that is when an admin confirmed the slip (applyConfirmedPayment stamps
 * `new Date()`), so a slow review would turn an on-time transfer late. Instead the confirmed
 * payments are replayed through allocatePayment in the order they were applied (one submission
 * awaits review per loan, so confirmedAt ?? createdAt), and each installment is judged by the
 * transfer date (paidAt ?? createdAt) of the payment that settled it, on Bangkok calendar days.
 */
export function deriveInstallmentConduct(
  installments: ConductInstallment[],
  payments: ConductPayment[] = [],
  now: Date = new Date(),
): InstallmentConduct[] {
  const today = bangkokDateKey(now);
  const targets: PaymentAllocationTarget[] = installments.map((inst, index) => ({
    id: BigInt(index),
    seq: inst.seq,
    amountDue: inst.amountDue,
    amountPaid: 0,
  }));
  const settledOn: (string | null)[] = installments.map(() => null);

  const confirmed = payments
    .filter((pay) => pay.status === "confirmed")
    .sort((a, b) => time(a.confirmedAt ?? a.createdAt) - time(b.confirmedAt ?? b.createdAt));

  for (const pay of confirmed) {
    const unsettled = targets.filter((_, index) => settledOn[index] === null);
    const paidOn = bangkokDateKey(pay.paidAt ?? pay.createdAt ?? pay.confirmedAt ?? now);
    for (const entry of allocatePayment(unsettled, pay.amount).allocations) {
      const index = Number(entry.id);
      targets[index].amountPaid = entry.amountPaid;
      if (entry.settled) settledOn[index] = paidOn;
    }
  }

  return installments.map((inst, index) => {
    const due = bangkokDateKey(inst.dueDate);
    const paidOn = settledOn[index];
    if (paidOn) return paidOn <= due ? "on_time" : "late";
    // Seed/legacy path: settled in the DB with no confirmed payment explaining it.
    if (inst.settledAt) return bangkokDateKey(inst.settledAt) <= due ? "on_time" : "late";
    if (inst.amountPaid < inst.amountDue && today > due) return "late";
    return null;
  });
}
