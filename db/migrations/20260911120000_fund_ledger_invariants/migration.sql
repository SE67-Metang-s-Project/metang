-- Convert fund_transaction.kind and payment.status to enums, and enforce the fund ledger
-- invariants (append-only, non-negative balance, disburse-once) at the database layer.

BEGIN;

-- Data migration before the type change: normalize legacy free-text kind values to the
-- new enum labels while the column is still text.
UPDATE "public"."fund_transaction" SET "kind" = 'disbursement' WHERE "kind" = 'disburse';
UPDATE "public"."fund_transaction" SET "kind" = 'credit_adjustment'
  WHERE "kind" = 'adjustment' AND "direction" = 1;
UPDATE "public"."fund_transaction" SET "kind" = 'debit_adjustment'
  WHERE "kind" = 'adjustment' AND "direction" = -1;

-- CreateEnum
CREATE TYPE "public"."fund_transaction_kind" AS ENUM (
  'top_up',
  'withdrawal',
  'credit_adjustment',
  'debit_adjustment',
  'disbursement',
  'repayment'
);

-- CreateEnum
CREATE TYPE "public"."payment_status" AS ENUM ('pending_review', 'confirmed', 'rejected');

-- AlterTable: fund_transaction.kind text -> enum
ALTER TABLE "public"."fund_transaction"
  ALTER COLUMN "kind" TYPE "public"."fund_transaction_kind"
  USING "kind"::"public"."fund_transaction_kind";

-- AlterTable: payment.status text -> enum (values already match the enum labels; no data
-- migration needed).
ALTER TABLE "public"."payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."payment"
  ALTER COLUMN "status" TYPE "public"."payment_status"
  USING "status"::"public"."payment_status";
ALTER TABLE "public"."payment" ALTER COLUMN "status" SET DEFAULT 'pending_review';

-- Ledger integrity CHECK constraints.
ALTER TABLE "public"."fund_transaction"
  ADD CONSTRAINT "fund_transaction_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "fund_transaction_direction_valid" CHECK ("direction" IN (-1, 1)),
  ADD CONSTRAINT "fund_transaction_kind_direction_pairing" CHECK (
    ("kind" IN ('top_up', 'credit_adjustment', 'repayment') AND "direction" = 1)
    OR ("kind" IN ('withdrawal', 'debit_adjustment', 'disbursement') AND "direction" = -1)
  );

-- Non-negative balance guard: recompute the whole-table balance after every insert.
-- ponytail: full-table SUM per insert, switch to a running-balance column if this table grows large
CREATE FUNCTION "public"."fund_transaction_check_balance"() RETURNS trigger AS $$
DECLARE
  running_balance integer;
BEGIN
  SELECT COALESCE(SUM("amount" * "direction"), 0)
    INTO running_balance
    FROM "public"."fund_transaction";

  IF running_balance < 0 THEN
    RAISE EXCEPTION 'fund_transaction: insufficient balance' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "fund_transaction_check_balance"
  AFTER INSERT ON "public"."fund_transaction"
  FOR EACH ROW EXECUTE FUNCTION "public"."fund_transaction_check_balance"();

-- Append-only guard: the ledger is never updated or deleted, including attaching a slip path
-- later - any slip path must be known before the row is inserted. Seeding gets an explicit
-- session-scoped escape hatch (see db/seed.ts, SET LOCAL methang.allow_fund_mutation).
CREATE FUNCTION "public"."fund_transaction_block_mutation"() RETURNS trigger AS $$
BEGIN
  IF current_setting('methang.allow_fund_mutation', true) = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  RAISE EXCEPTION 'fund_transaction is append-only; % is not allowed', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "fund_transaction_append_only"
  BEFORE UPDATE OR DELETE ON "public"."fund_transaction"
  FOR EACH ROW EXECUTE FUNCTION "public"."fund_transaction_block_mutation"();

-- Disburse-once per loan, enforced at the DB layer.
CREATE UNIQUE INDEX "fund_transaction_one_disbursement_per_loan"
  ON "public"."fund_transaction"("loan_id")
  WHERE "kind" = 'disbursement';

COMMIT;
