BEGIN;

DO $$
DECLARE
  mismatched_loan_ids text;
  unauthorized_loan_ids text;
BEGIN
  SELECT string_agg(loan_id::text, ', ' ORDER BY loan_id::text)
    INTO mismatched_loan_ids
  FROM (
    SELECT DISTINCT executive.loan_id
    FROM "public"."loan_approval" AS executive
    WHERE executive.step = 'executive'
      AND NOT EXISTS (
        SELECT 1
        FROM "public"."loan_approval" AS admin
        WHERE admin.loan_id = executive.loan_id
          AND admin.step = 'admin'
          AND admin.attempt = executive.attempt
          AND admin.decision = 'approved'
      )
  ) AS mismatches;

  IF mismatched_loan_ids IS NOT NULL THEN
    RAISE EXCEPTION 'admin/executive approval attempts require remediation; loan IDs: %', mismatched_loan_ids;
  END IF;

  SELECT string_agg(loan_id::text, ', ' ORDER BY loan_id::text)
    INTO unauthorized_loan_ids
  FROM (
    SELECT DISTINCT executive.loan_id
    FROM "public"."loan_request" AS loan
    JOIN "public"."loan_approval" AS executive
      ON executive.loan_id = loan.id
     AND executive.step = 'executive'
     AND executive.decision = 'pending'
    JOIN "public"."loan_approval" AS admin
      ON admin.loan_id = executive.loan_id
     AND admin.step = 'admin'
     AND admin.attempt = executive.attempt
     AND admin.decision = 'approved'
    WHERE loan.status = 'pending_executive'
      AND NOT EXISTS (
        SELECT 1
        FROM "public"."user_role" AS role
        WHERE role.user_id = admin.decided_by
          AND role.role IN ('admin', 'super_admin')
      )
  ) AS unauthorized;

  IF unauthorized_loan_ids IS NOT NULL THEN
    RAISE EXCEPTION 'active Executive loans have no effective Admin owner; loan IDs: %', unauthorized_loan_ids;
  END IF;
END $$;

ALTER TABLE "public"."loan_request"
  ADD COLUMN "assigned_admin_id" UUID;

ALTER TABLE "public"."loan_approval"
  ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "public"."loan_request" AS loan
SET "assigned_admin_id" = admin."decided_by"
FROM "public"."loan_approval" AS executive
JOIN "public"."loan_approval" AS admin
  ON admin."loan_id" = executive."loan_id"
 AND admin."step" = 'admin'
 AND admin."attempt" = executive."attempt"
 AND admin."decision" = 'approved'
WHERE loan."id" = executive."loan_id"
  AND loan."status" = 'pending_executive'
  AND executive."step" = 'executive'
  AND executive."decision" = 'pending';

CREATE INDEX "loan_request_assigned_admin_idx"
  ON "public"."loan_request"("assigned_admin_id", "status");

ALTER TABLE "public"."loan_request"
  ADD CONSTRAINT "loan_request_assigned_admin_id_fkey"
  FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."app_user"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

DROP TABLE IF EXISTS "public"."notification_outbox";
DROP TYPE IF EXISTS "public"."notification_status";

COMMIT;
