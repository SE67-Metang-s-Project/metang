# Proposal: Compute repayment conduct in the database

- **Status:** Draft for team review
- **Related:** NAT-27 (end-to-end loan repayment), NAT-167 (student repayment UI), NAT-168 (admin repayment review UI)
- **Date:** 2026-09-23

## Summary

Move the "on time / late" repayment conduct rule into one Postgres view, `installment_conduct`, so the
student dashboard, the admin screens, and any future report read the same answer. The view derives
conduct from the confirmed payments and their transfer date (`payment.paid_at`), not from the time an
admin confirmed the payment.

## Problem

NAT-27 says: "Conduct is derived from repayment history and is never editable input." Before NAT-167
the rule was duplicated in TypeScript and it used the wrong timestamp.

| Where | Code | Rule before NAT-167 |
| --- | --- | --- |
| Student dashboard | `lib/student-view-model.ts`, `computePaymentBehavior` | late if `installment.settled_at > due_date` |
| Admin / SuperAdmin request views | `db/queries/loan-requests.ts` (around line 673) | same rule, written again |

NAT-167 (commit `f61719c`) fixed the first two problems below in the application with one shared helper,
`lib/repayment-conduct.ts`. This proposal is about moving that rule into the database. The problems were:

1. **Wrong timestamp.** `settled_at` is written when an admin confirms the payment
   (`db/queries/payments.ts` sets `settledAt: appliedAt`, where `appliedAt = new Date()`). If a student
   transfers on time but the review happens after the due date, the installment is counted as late.
2. **Wrong day boundary.** `due_date` is a Postgres `date`. In JavaScript it becomes UTC midnight, which
   is 07:00 in Bangkok. A payment confirmed on the due date after 07:00 counts as late, and an unpaid
   installment shows "overdue" on its own due date.
3. **Drift.** Each new screen that shows conduct (executive dashboard, loan report PDF) must copy the
   rule again. The two copies above already differ in how they count `totalInstallments`.

A read-only check of the dev database on 2026-09-23 found no existing view, function, or column for
conduct. The only public functions are `fund_transaction_block_mutation`,
`fund_transaction_check_balance`, and `next_loan_request_id`.

## Proposed rule

An installment is **on time** when the confirmed payment that settled it was transferred on or before
its due date (Bangkok calendar day, inclusive). It is **late** when that transfer came after the due
date, or when it is still unsettled after the due date. An unsettled installment that is not yet due is
**not counted**.

| Condition | Conduct |
| --- | --- |
| Settled by a confirmed payment with transfer date on or before the due date | `on_time` |
| Settled by a confirmed payment with transfer date after the due date | `late` |
| Not settled, and the due date is before today (Bangkok) | `late` |
| Not settled, and the due date is today or later | `not_due` |

Only payments with `status = 'confirmed'` count. `pending_review` and `rejected` payments never count.
When `paid_at` is missing, the submission time (`created_at`) is used.

### Why a simple cumulative SQL rule is not enough

`allocatePayment` (`lib/loan-validation.ts`) does not fill installments strictly oldest first. It fills
the oldest unsettled installment, then the **last** one, then the rest in ascending order. So "the
payments made by the due date cover everything due up to this installment" gives the wrong answer when
a payment prepays the last installment. The only reliable way to know which payment settled an
installment is to record it when the payment is applied, or to replay the allocation.

## Proposed change

### Step 1: record the settling payment

Add a nullable column and write it in the same transaction that settles the installment
(`applyConfirmedPayment` in `db/queries/payments.ts`, where `settledAt` is already written):

```sql
ALTER TABLE installment
  ADD COLUMN settled_by_payment_id uuid REFERENCES payment (id);
```

```ts
// db/queries/payments.ts, inside the allocation loop
data: {
  amountPaid: entry.amountPaid,
  settledAt: entry.settled ? appliedAt : null,
  settledByPaymentId: entry.settled ? payment.id : null,
},
```

Existing settled rows can be backfilled once by replaying confirmed payments through `allocatePayment`
in confirmation order (the same replay that `lib/repayment-conduct.ts` does today). Rows that cannot be
explained, such as seed data, keep `NULL` and fall back to `settled_at`.

### Step 2: the view

```sql
CREATE VIEW installment_conduct
WITH (security_invoker = true) AS
SELECT
  i.id AS installment_id,
  i.loan_id,
  i.seq,
  CASE
    WHEN i.settled_at IS NOT NULL THEN
      CASE
        WHEN (COALESCE(p.paid_at, p.created_at, i.settled_at) AT TIME ZONE 'Asia/Bangkok')::date
             <= i.due_date
        THEN 'on_time'
        ELSE 'late'
      END
    WHEN i.due_date < (now() AT TIME ZONE 'Asia/Bangkok')::date THEN 'late'
    ELSE 'not_due'
  END AS conduct
FROM installment i
LEFT JOIN payment p ON p.id = i.settled_by_payment_id;

-- The app reads this through Prisma with the service connection only.
REVOKE ALL ON installment_conduct FROM anon, authenticated;
```

Notes on the SQL:

- `security_invoker = true` makes the view respect the caller's permissions. Without it, a Postgres view
  runs with the owner's rights, and Supabase would expose it through the Data API to any role that has
  `SELECT` on it.
- The `REVOKE` keeps the view off the Supabase Data API. Remove it only if we decide to read conduct
  through PostgREST, which the app does not do today.
- The view is a plain join. It needs no window functions and no replay, so it stays cheap.

## How the app reads it

Prisma cannot model a view without the `views` preview feature. We already use `$queryRaw` in
`db/queries/notifications.ts`, so a small query function is enough:

```ts
// db/queries/repayment-conduct.ts
export type InstallmentConduct = "on_time" | "late" | "not_due";

export async function getConductByLoanIds(loanIds: string[]) {
  if (loanIds.length === 0) return [];
  return prisma.$queryRaw<
    { installment_id: bigint; loan_id: string; seq: number; conduct: InstallmentConduct }[]
  >`SELECT installment_id, loan_id, seq, conduct
    FROM installment_conduct
    WHERE loan_id = ANY(${loanIds})`;
}
```

Consumers to switch:

1. `db/queries/loan-requests.ts`: the admin conduct block (around line 673) counts `on_time` and `late`
   rows instead of comparing `settledAt`.
2. `app/student/page.tsx` and `GET /api/student/loan-requests*`: return conduct with the loan so that
   `computePaymentBehavior` and the installment cards read it instead of calculating it.
3. Any new report (executive dashboard, loan report PDF) reads the same view.

## Alternative: one shared TypeScript helper

The NAT-167 work adds `lib/repayment-conduct.ts` (`deriveInstallmentConduct`). It replays the confirmed
payments through the real `allocatePayment` to find the payment that settled each installment, then
applies the rule above. The student dashboard and the admin/advisor views (`getActionRequests` in
`db/queries/loan-requests.ts`) both use it, so they agree today.

| | Database view | TypeScript helper |
| --- | --- | --- |
| Single source of truth | Yes, for every reader, including SQL reports | Only for code that imports it |
| Time zone handling | `AT TIME ZONE 'Asia/Bangkok'` in SQL, no server or browser dependency | Needs explicit `Intl` handling |
| Schema change | Yes: one column, one view, one backfill | No |
| Testing | Needs a database (migration test plus a seeded check) | Plain unit tests |
| Effort | Estimate: 1-2 days including backfill and tests | Done in NAT-167 |

**Recommendation:** keep the TypeScript helper from NAT-167 for now. Add the column and the view as a
follow-up ticket when a SQL reader (report, export, executive dashboard) needs conduct. Then move every
reader to the view and delete the helper so only one rule remains.

## Open questions for the team

1. **Overpayment redistribution.** NAT-27 says an overpayment reduces and redistributes the remaining
   principal over unsettled installments, which changes `amount_due` on later installments. The view uses
   the current `amount_due`. Is that the conduct we want, or do we need the original schedule?
2. **Grace period.** Is a payment transferred on the due date on time? This proposal says yes (the
   comparison is inclusive). Does the faculty allow any grace days?
3. **Trusting `paid_at`.** The student enters `paid_at`. The server rejects future dates, and the admin
   checks the slip before confirming. Is that enough, or should the admin be able to correct `paid_at`
   during review (NAT-168)?
4. **Counting.** Should `totalInstallments` include `not_due` installments? The student and admin views
   disagree today.

## Test plan

1. Migration test in `tests/` in the style of `tests/fund-ledger-invariants.migration.test.mjs`: the
   migration adds `settled_by_payment_id` and creates the view with `security_invoker` and the `REVOKE`.
2. Unit test that `applyConfirmedPayment` writes `settledByPaymentId` for every installment it settles.
3. On a Supabase dev database with seeded loans, check these cases:
   - Transfer before the due date, confirmed after it: `on_time`.
   - Transfer after the due date: `late`.
   - One overpayment that covers two installments before their due dates: both `on_time`.
   - A payment that settles the first installment and prepays the last one: the view matches what
     `allocatePayment` wrote.
   - Unpaid, due tomorrow: `not_due`. Unpaid, due yesterday: `late`.
   - Rejected or pending payment only: not counted.
4. Compare the counts from the view with the output of `deriveInstallmentConduct` for a few real loans before switching
   the readers.

## Rollout

1. Review this proposal and answer the open questions.
2. Add the migration and the `applyConfirmedPayment` change, run the backfill, and test on your own
   Supabase dev database (`npm run db:migrate`).
3. Switch the admin block, then the student read, one pull request each.
4. Apply to production with `npm run db:deploy`.
5. Delete the TypeScript conduct helper once every reader uses the view.
