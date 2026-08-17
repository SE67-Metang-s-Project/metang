-- Add the student's academic year and an optional note to each loan request.

ALTER TABLE "public"."loan_request"
ADD COLUMN "student_year" SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN "additional_note" TEXT;

ALTER TABLE "public"."loan_request"
ALTER COLUMN "student_year" DROP DEFAULT;

ALTER TABLE "public"."loan_request"
ADD CONSTRAINT "loan_request_student_year_range"
CHECK ("student_year" BETWEEN 1 AND 4);
