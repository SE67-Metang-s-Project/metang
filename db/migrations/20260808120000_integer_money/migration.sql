-- Store all monetary values as whole-baht PostgreSQL integers.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."loan_request"
    WHERE "amount" <> trunc("amount")
      OR ("approved_amount" IS NOT NULL AND "approved_amount" <> trunc("approved_amount"))
  ) THEN
    RAISE EXCEPTION 'Cannot convert loan_request money to integer: fractional value found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "public"."installment"
    WHERE "amount_due" <> trunc("amount_due")
      OR "amount_paid" <> trunc("amount_paid")
  ) THEN
    RAISE EXCEPTION 'Cannot convert installment money to integer: fractional value found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "public"."payment"
    WHERE "amount" <> trunc("amount")
      OR ("ocr_amount" IS NOT NULL AND "ocr_amount" <> trunc("ocr_amount"))
  ) THEN
    RAISE EXCEPTION 'Cannot convert payment money to integer: fractional value found';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "public"."fund_transaction"
    WHERE "amount" <> trunc("amount")
  ) THEN
    RAISE EXCEPTION 'Cannot convert fund transaction money to integer: fractional value found';
  END IF;
END
$$;

ALTER TABLE "public"."loan_request"
ALTER COLUMN "amount" TYPE INTEGER USING "amount"::INTEGER,
ALTER COLUMN "approved_amount" TYPE INTEGER USING "approved_amount"::INTEGER;

ALTER TABLE "public"."installment"
ALTER COLUMN "amount_due" TYPE INTEGER USING "amount_due"::INTEGER,
ALTER COLUMN "amount_paid" DROP DEFAULT,
ALTER COLUMN "amount_paid" TYPE INTEGER USING "amount_paid"::INTEGER,
ALTER COLUMN "amount_paid" SET DEFAULT 0;

ALTER TABLE "public"."payment"
ALTER COLUMN "amount" TYPE INTEGER USING "amount"::INTEGER,
ALTER COLUMN "ocr_amount" TYPE INTEGER USING "ocr_amount"::INTEGER;

ALTER TABLE "public"."fund_transaction"
ALTER COLUMN "amount" TYPE INTEGER USING "amount"::INTEGER;
