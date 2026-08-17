-- Add stable CMU identity, normalize loan advisor ownership, and retain approval attempts.

ALTER TABLE "public"."app_user"
ADD COLUMN "cmu_account" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."app_user"
    WHERE "email" IS NULL OR btrim("email") = ''
  ) THEN
    RAISE EXCEPTION 'Cannot backfill app_user.cmu_account: an app_user has no email';
  END IF;

  UPDATE "public"."app_user"
  SET "cmu_account" = lower(btrim("email"))
  WHERE "cmu_account" IS NULL;

  IF EXISTS (
    SELECT "cmu_account"
    FROM "public"."app_user"
    GROUP BY "cmu_account"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot backfill app_user.cmu_account: duplicate CMU accounts';
  END IF;
END
$$;

ALTER TABLE "public"."app_user"
ALTER COLUMN "cmu_account" SET NOT NULL;

CREATE UNIQUE INDEX "app_user_cmu_account_key"
ON "public"."app_user"("cmu_account" ASC);

ALTER TABLE "public"."loan_request"
ADD COLUMN "advisor_id" UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "public"."loan_request" lr
    WHERE NOT EXISTS (
      SELECT 1
      FROM "public"."app_user" u
      WHERE u."full_name_th" = lr."advisor_name"
        AND EXISTS (
          SELECT 1
          FROM "public"."user_role" ur
          WHERE ur."user_id" = u."id" AND ur."role" = 'advisor'::"public"."user_role_name"
        )
    )
  ) THEN
    RAISE EXCEPTION 'Cannot backfill loan_request.advisor_id: advisor name has no matching app_user';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "public"."loan_request" lr
    WHERE (
      SELECT count(*)
      FROM "public"."app_user" u
      WHERE u."full_name_th" = lr."advisor_name"
        AND EXISTS (
          SELECT 1
          FROM "public"."user_role" ur
          WHERE ur."user_id" = u."id" AND ur."role" = 'advisor'::"public"."user_role_name"
        )
    ) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot backfill loan_request.advisor_id: advisor name is ambiguous';
  END IF;

  UPDATE "public"."loan_request" lr
  SET "advisor_id" = u."id"
  FROM "public"."app_user" u
  WHERE u."full_name_th" = lr."advisor_name"
    AND EXISTS (
      SELECT 1
      FROM "public"."user_role" ur
      WHERE ur."user_id" = u."id" AND ur."role" = 'advisor'::"public"."user_role_name"
    );
END
$$;

ALTER TABLE "public"."loan_request"
ALTER COLUMN "advisor_id" SET NOT NULL;

DROP INDEX "public"."loan_request_advisor_idx";
DROP INDEX "public"."loan_approval_loan_id_step_key";

ALTER TABLE "public"."loan_request"
DROP COLUMN "advisor_name";

ALTER TABLE "public"."loan_request"
ADD CONSTRAINT "loan_request_advisor_id_fkey"
FOREIGN KEY ("advisor_id") REFERENCES "public"."app_user"("id")
ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX "loan_request_advisor_idx"
ON "public"."loan_request"("advisor_id" ASC, "status" ASC);

ALTER TABLE "public"."loan_request"
ADD CONSTRAINT "loan_request_amount_positive"
CHECK ("amount" > 0),
ADD CONSTRAINT "loan_request_approved_amount_bounds"
CHECK ("approved_amount" IS NULL OR ("approved_amount" > 0 AND "approved_amount" <= "amount")),
ADD CONSTRAINT "loan_request_installment_count_range"
CHECK ("installment_count" BETWEEN 1 AND 3);

ALTER TABLE "public"."loan_approval"
ADD COLUMN "attempt" SMALLINT NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "loan_approval_loan_id_step_attempt_key"
ON "public"."loan_approval"("loan_id" ASC, "step" ASC, "attempt" ASC);

CREATE UNIQUE INDEX "loan_approval_one_pending_key"
ON "public"."loan_approval"("loan_id" ASC, "step" ASC)
WHERE "decision" = 'pending'::"public"."decision";

ALTER TABLE "public"."loan_approval"
ADD CONSTRAINT "loan_approval_decision_actor_time_consistency"
CHECK (
  ("decision" = 'pending'::"public"."decision" AND "decided_by" IS NULL AND "decided_at" IS NULL)
  OR
  ("decision" <> 'pending' AND "decided_by" IS NOT NULL AND "decided_at" IS NOT NULL)
);
