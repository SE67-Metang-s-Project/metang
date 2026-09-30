-- Students are no longer app_user rows. A loan request carries its borrower's identity itself
-- (student code, names, email, phone, education level), copied from the CMU session at submit,
-- and a student's loans are found by student code. Student audit rows name the student by code
-- (actor_student_code) instead of by app_user id.
--
-- Backfills every loan and student audit row from the old rows, then deletes the student-only
-- app_user rows (student role and no other) and every student role. Staff rows stay; a staff
-- row that still holds a loan_approval/payment/ledger reference makes the DELETE fail loudly.
-- Multi-step with a backfill in the middle, so it runs as one transaction.
BEGIN;

CREATE TEMP TABLE student_only_user ON COMMIT DROP AS
  SELECT u.id, u.student_code
  FROM "public"."app_user" u
  WHERE EXISTS (SELECT 1 FROM "public"."user_role" r WHERE r.user_id = u.id AND r.role = 'student')
    AND NOT EXISTS (SELECT 1 FROM "public"."user_role" r WHERE r.user_id = u.id AND r.role <> 'student');

-- loan_request: copy the borrower onto the loan.
ALTER TABLE "public"."loan_request"
  ADD COLUMN "student_code" TEXT,
  ADD COLUMN "student_name_th" TEXT,
  ADD COLUMN "student_name_en" TEXT,
  ADD COLUMN "student_email" TEXT,
  ADD COLUMN "student_phone" TEXT,
  ADD COLUMN "student_education_level" TEXT;

UPDATE "public"."loan_request" l
SET "student_code" = u."student_code",
    "student_name_th" = u."full_name_th",
    "student_name_en" = u."full_name_en",
    "student_email" = u."email",
    "student_phone" = u."phone",
    -- The degree is stored as its student-code digit; older rows hold the Thai name instead.
    "student_education_level" = CASE u."education_level"
      WHEN 'ประกาศนียบัตรผู้ช่วยพยาบาล' THEN '0'
      WHEN 'ปริญญาตรี' THEN '1'
      WHEN 'ปริญญาโท' THEN '3'
      WHEN 'ปริญญาเอก' THEN '5'
      ELSE u."education_level"
    END
FROM "public"."app_user" u
WHERE u."id" = l."student_id";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "public"."loan_request" WHERE "student_code" IS NULL) THEN
    RAISE EXCEPTION 'Cannot backfill loan_request.student_code: a borrower has no student code';
  END IF;
END $$;

ALTER TABLE "public"."loan_request"
  ALTER COLUMN "student_code" SET NOT NULL,
  ALTER COLUMN "student_name_th" SET NOT NULL,
  ALTER COLUMN "student_email" SET NOT NULL,
  ADD CONSTRAINT "loan_request_student_education_level_code"
    CHECK ("student_education_level" IN ('0', '1', '3', '5'));

-- cancelled_by goes: a student cancel needs only cancelled_at, and an admin cancel is already
-- named by its rejected admin loan_approval row and its audit_log row.
DROP INDEX "public"."one_open_loan_per_student";
DROP INDEX "public"."loan_request_student_idx";
ALTER TABLE "public"."loan_request"
  DROP CONSTRAINT "loan_request_student_id_fkey",
  DROP CONSTRAINT "loan_request_cancelled_by_fkey",
  DROP COLUMN "student_id",
  DROP COLUMN "cancelled_by";

CREATE UNIQUE INDEX "one_open_loan_per_student" ON "public"."loan_request"("student_code" ASC)
  WHERE (status <> ALL (ARRAY['closed'::loan_status, 'rejected'::loan_status, 'cancelled'::loan_status]));
CREATE INDEX "loan_request_student_idx" ON "public"."loan_request"("student_code" ASC);

-- audit_log: a student actor is named by code.
ALTER TABLE "public"."audit_log"
  ADD COLUMN "actor_student_code" TEXT,
  ALTER COLUMN "actor_id" DROP NOT NULL;

UPDATE "public"."audit_log" a
SET "actor_student_code" = s."student_code", "actor_id" = NULL
FROM student_only_user s
WHERE a."actor_id" = s."id";

ALTER TABLE "public"."audit_log"
  ADD CONSTRAINT "audit_log_one_actor" CHECK (num_nonnulls("actor_id", "actor_student_code") = 1);

-- app_user: drop the students and the student-only columns.
DELETE FROM "public"."user_role" WHERE "role" = 'student';
DELETE FROM "public"."app_user" u USING student_only_user s WHERE u."id" = s."id";

ALTER TABLE "public"."app_user"
  DROP COLUMN "student_code",
  DROP COLUMN "education_level";

COMMIT;
