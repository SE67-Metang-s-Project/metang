-- The staff pages filter the loan queue by status and sort by submitted_at, and read installments by
-- loan_id. Neither had a usable index: loan_request had none on status, and installment's
-- unique key is (seq, loan_id), which cannot serve a lookup by loan_id alone.
--
-- Plain DESC (not NULLS LAST) so the index matches what Prisma can express in schema.prisma and
-- migrate diff stays clean. Staff pages exclude drafts, the only rows with a NULL submitted_at.

BEGIN;

CREATE INDEX "loan_request_status_submitted_idx" ON "public"."loan_request" ("status", "submitted_at" DESC);

CREATE INDEX "installment_loan_idx" ON "public"."installment" ("loan_id");

COMMIT;
