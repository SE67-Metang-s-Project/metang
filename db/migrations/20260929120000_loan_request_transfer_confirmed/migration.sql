-- The student's "confirm receipt" was kept only in the browser (localStorage), so the server never
-- knew about it and the payment API could not require it. Store it on the loan instead. It can
-- only follow a disbursement, so the check ties it to disbursed_at.
--
-- Backfill: loans whose borrower clearly received the money - closed loans, and disbursed loans
-- that already have a payment. Other disbursed loans stay NULL and the student confirms again.
-- disbursed_at is the only timestamp known for them, so it stands in for the confirmation time.

BEGIN;

ALTER TABLE "public"."loan_request" ADD COLUMN "transfer_confirmed_at" TIMESTAMPTZ(6);

ALTER TABLE "public"."loan_request"
  ADD CONSTRAINT "loan_request_transfer_confirmed_after_disbursement"
  CHECK ("transfer_confirmed_at" IS NULL OR "disbursed_at" IS NOT NULL);

UPDATE "public"."loan_request" l SET "transfer_confirmed_at" = l."disbursed_at"
WHERE l."disbursed_at" IS NOT NULL AND (l."status" = 'closed'
  OR (l."status" = 'disbursed'
    AND EXISTS (SELECT 1 FROM "public"."payment" p WHERE p."loan_id" = l."id")));

COMMIT;
