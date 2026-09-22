-- The reviewer's reason for a payment decision. Required by the app when a payment is rejected,
-- so the student is told what to fix before resubmitting; optional on a confirmation.
--
-- Nullable, and no parallel "reviewed_by"/"reviewed_at" pair: "confirmed_by"/"confirmed_at"
-- already mean "the reviewer, and the moment of review", and are now written for a rejection too.
-- A second pair would hold the same values as the first on every confirmation.

BEGIN;

ALTER TABLE "public"."payment" ADD COLUMN "review_note" TEXT;

COMMIT;
