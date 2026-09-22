-- Link a repayment ledger row back to the payment that produced it, and make a second credit
-- for the same payment impossible at the database layer. Mirrors the shape of
-- "fund_transaction_one_disbursement_per_loan" from 20260911120000_fund_ledger_invariants:
-- "loan_id" cannot carry this guard because a loan legitimately has many repayments.
--
-- No backfill. The three seeded "repayment" rows (db/seed.ts) predate this column and keep
-- "payment_id" NULL; Postgres treats NULLs as distinct in a unique index, so they neither
-- collide with each other nor block this migration. Rewriting them in place is not an option
-- anyway: "fund_transaction" carries a BEFORE UPDATE OR DELETE append-only trigger that would
-- reject the UPDATE without the methang.allow_fund_mutation escape hatch. db/seed.ts sets
-- "payment_id" on those rows instead, so a reseed leaves no unlinked repayments behind.
--
-- ponytail: the guard only bites for rows that actually set "payment_id". Promote it to
-- CHECK (("kind" = 'repayment') = ("payment_id" IS NOT NULL)) once no legacy NULL repayment
-- rows remain in any environment.

BEGIN;

ALTER TABLE "public"."fund_transaction" ADD COLUMN "payment_id" UUID;

ALTER TABLE "public"."fund_transaction"
  ADD CONSTRAINT "fund_transaction_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE UNIQUE INDEX "fund_transaction_one_repayment_per_payment"
  ON "public"."fund_transaction"("payment_id")
  WHERE "kind" = 'repayment';

COMMIT;
