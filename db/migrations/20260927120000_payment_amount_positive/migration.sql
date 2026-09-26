-- A repayment moves money, so a zero or negative amount has no meaning. The API has always
-- rejected amount <= 0 (parseStudentPaymentInput); this makes the database refuse it for any
-- writer that bypasses the route (seed, scripts, a future endpoint). Every existing row came
-- through that parser, and the seed's payments are 500-1500, so validation cannot fail.

BEGIN;

ALTER TABLE "public"."payment"
  ADD CONSTRAINT "payment_amount_positive" CHECK ("amount" > 0);

COMMIT;
