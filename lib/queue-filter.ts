// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
// The status filters of the staff queue pages, moved server-side. These are the rules the lists
// applied to the full array in the browser (SharedRequestsList, SuperAdminRequestsList and the
// two executive lists), keyed by the role whose queue it is.

export type QueueRole = "advisor" | "admin" | "executive";

export const QUEUE_FILTERS = [
  "all",
  "pending",
  "approved",
  "rejected",
  "pending_admin",
  "cancelled",
  "pending_executive",
  "pending_disbursement",
  "disbursed",
  "closed",
  "returned",
  "draft",
  "pending_advisor",
] as const;

export type QueueFilter = (typeof QUEUE_FILTERS)[number];

export const isQueueFilter = (value: string): value is QueueFilter =>
  (QUEUE_FILTERS as readonly string[]).includes(value);

/** The status a role is waiting to act on: the "pending" tab and its badge. */
export function pendingStatusFor(role: QueueRole): string {
  return role === "advisor" ? "pending_advisor" : role === "executive" ? "pending_executive" : "pending_admin";
}

// "Approved" is every status past the role's own step.
const APPROVED_STATUSES: Record<QueueRole, string[]> = {
  admin: ["pending_executive", "pending_disbursement", "disbursed", "closed"],
  advisor: ["pending_admin", "pending_executive", "pending_disbursement", "disbursed", "closed"],
  executive: ["pending_disbursement", "disbursed", "closed"],
};

/** Statuses a filter selects, or null for "every status the queue holds". */
export function statusesForFilter(role: QueueRole, filter: QueueFilter): string[] | null {
  if (filter === "all") return null;
  if (filter === "pending") return [pendingStatusFor(role)];
  if (filter === "approved") return APPROVED_STATUSES[role];
  return [filter];
}
