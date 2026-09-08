-- Replace UUID loan request IDs with REQyyyymmddxxxx identifiers.
-- The suffix is global and starts at 0000; it does not reset.

CREATE SEQUENCE "public"."loan_request_number_seq"
  AS INTEGER
  MINVALUE 0
  MAXVALUE 9999
  START 0
  INCREMENT 1
  NO CYCLE;

CREATE TABLE "public"."loan_request_id_map" (
  "old_id" UUID NOT NULL PRIMARY KEY,
  "new_id" TEXT NOT NULL UNIQUE
);

INSERT INTO "public"."loan_request_id_map" ("old_id", "new_id")
SELECT
  "id",
  'REQ' || to_char("created_at" AT TIME ZONE 'Asia/Bangkok', 'YYYYMMDD') ||
    lpad((row_number() OVER (ORDER BY "created_at", "id") - 1)::text, 4, '0')
FROM "public"."loan_request";

DO $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT count(*) INTO request_count FROM "public"."loan_request";
  IF request_count > 10000 THEN
    RAISE EXCEPTION 'Cannot create REQ IDs: % loan requests exceed the 0000-9999 range', request_count;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION "public"."lookup_loan_request_id"(UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT "new_id" FROM "public"."loan_request_id_map" WHERE "old_id" = $1
$$;

ALTER TABLE "public"."fund_transaction" DROP CONSTRAINT "fund_transaction_loan_id_fkey";
ALTER TABLE "public"."installment" DROP CONSTRAINT "installment_loan_id_fkey";
ALTER TABLE "public"."loan_approval" DROP CONSTRAINT "loan_approval_loan_id_fkey";
ALTER TABLE "public"."payment" DROP CONSTRAINT "payment_loan_id_fkey";

ALTER TABLE "public"."loan_request"
  ALTER COLUMN "id" TYPE TEXT USING "public"."lookup_loan_request_id"("id");
ALTER TABLE "public"."fund_transaction"
  ALTER COLUMN "loan_id" TYPE TEXT USING "public"."lookup_loan_request_id"("loan_id");
ALTER TABLE "public"."installment"
  ALTER COLUMN "loan_id" TYPE TEXT USING "public"."lookup_loan_request_id"("loan_id");
ALTER TABLE "public"."loan_approval"
  ALTER COLUMN "loan_id" TYPE TEXT USING "public"."lookup_loan_request_id"("loan_id");
ALTER TABLE "public"."payment"
  ALTER COLUMN "loan_id" TYPE TEXT USING "public"."lookup_loan_request_id"("loan_id");

ALTER TABLE "public"."fund_transaction"
  ADD CONSTRAINT "fund_transaction_loan_id_fkey"
  FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."installment"
  ADD CONSTRAINT "installment_loan_id_fkey"
  FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."loan_approval"
  ADD CONSTRAINT "loan_approval_loan_id_fkey"
  FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."payment"
  ADD CONSTRAINT "payment_loan_id_fkey"
  FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

DO $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT count(*) INTO request_count FROM "public"."loan_request";
  IF request_count = 0 THEN
    PERFORM setval('public.loan_request_number_seq', 0, false);
  ELSE
    PERFORM setval('public.loan_request_number_seq', request_count - 1, true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION "public"."next_loan_request_id"()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  number INTEGER;
BEGIN
  number := nextval('public.loan_request_number_seq');
  IF number > 9999 THEN
    RAISE EXCEPTION 'Loan request ID range exhausted';
  END IF;
  RETURN 'REQ' || to_char(current_timestamp AT TIME ZONE 'Asia/Bangkok', 'YYYYMMDD') ||
    lpad(number::text, 4, '0');
END;
$$;

ALTER TABLE "public"."loan_request"
  ALTER COLUMN "id" SET DEFAULT public.next_loan_request_id();

ALTER TABLE "public"."loan_request"
  ADD CONSTRAINT "loan_request_id_format"
  CHECK ("id" ~ '^REQ[0-9]{8}[0-9]{4}$');

DROP FUNCTION "public"."lookup_loan_request_id"(UUID);
DROP TABLE "public"."loan_request_id_map";
