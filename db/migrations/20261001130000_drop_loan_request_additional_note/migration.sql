-- The student application form no longer asks for an additional note, so nothing writes
-- loan_request.additional_note and no page shows it. Drop the column.
ALTER TABLE "public"."loan_request" DROP COLUMN "additional_note";
