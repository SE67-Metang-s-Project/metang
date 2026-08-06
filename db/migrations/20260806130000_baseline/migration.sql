-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."approval_step" AS ENUM ('advisor', 'admin', 'executive');

-- CreateEnum
CREATE TYPE "public"."decision" AS ENUM ('pending', 'approved', 'returned', 'rejected');

-- CreateEnum
CREATE TYPE "public"."loan_status" AS ENUM ('draft', 'returned', 'pending_advisor', 'pending_admin', 'pending_executive', 'pending_disbursement', 'disbursed', 'closed', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."user_role_name" AS ENUM ('student', 'advisor', 'admin', 'super_admin', 'executive');

-- CreateTable
CREATE TABLE "public"."app_user" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "student_code" TEXT,
    "full_name_th" TEXT NOT NULL,
    "full_name_en" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_log" (
    "id" BIGSERIAL NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fund_transaction" (
    "id" BIGSERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "direction" SMALLINT NOT NULL,
    "loan_id" UUID,
    "performed_by" UUID NOT NULL,
    "slip_url" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fund_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."installment" (
    "id" BIGSERIAL NOT NULL,
    "loan_id" UUID NOT NULL,
    "seq" SMALLINT NOT NULL,
    "due_date" DATE NOT NULL,
    "amount_due" DECIMAL(12,2) NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "settled_at" TIMESTAMPTZ(6),

    CONSTRAINT "installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loan_approval" (
    "id" BIGSERIAL NOT NULL,
    "loan_id" UUID NOT NULL,
    "step" "public"."approval_step" NOT NULL,
    "decision" "public"."decision" NOT NULL DEFAULT 'pending',
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "comment" TEXT,

    CONSTRAINT "loan_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."loan_request" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "advisor_name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "approved_amount" DECIMAL(12,2),
    "purpose" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_account_no" TEXT NOT NULL,
    "bank_account_name" TEXT NOT NULL,
    "installment_count" SMALLINT NOT NULL,
    "first_due_date" DATE NOT NULL,
    "status" "public"."loan_status" NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" UUID,
    "disbursed_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loan_id" UUID NOT NULL,
    "installment_id" BIGINT,
    "amount" DECIMAL(12,2) NOT NULL,
    "slip_url" TEXT,
    "slip_ref" TEXT,
    "slip_ocr_status" TEXT NOT NULL DEFAULT 'pending',
    "ocr_amount" DECIMAL(12,2),
    "ocr_paid_at" TIMESTAMPTZ(6),
    "slip_ocr_raw" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "confirmed_by" UUID,
    "confirmed_at" TIMESTAMPTZ(6),
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_role" (
    "user_id" UUID NOT NULL,
    "role" "public"."user_role_name" NOT NULL,
    "granted_by" UUID,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "public"."app_user"("email" ASC);

-- CreateIndex
CREATE INDEX "app_user_full_name_th_idx" ON "public"."app_user"("full_name_th" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_student_code_key" ON "public"."app_user"("student_code" ASC);

-- CreateIndex
CREATE INDEX "audit_log_entity_idx" ON "public"."audit_log"("entity_type" ASC, "entity_id" ASC);

-- CreateIndex
CREATE INDEX "fund_transaction_loan_idx" ON "public"."fund_transaction"("loan_id" ASC);

-- CreateIndex
CREATE INDEX "installment_due_idx" ON "public"."installment"("due_date" ASC) WHERE (settled_at IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "installment_loan_id_seq_key" ON "public"."installment"("seq" ASC, "loan_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "loan_approval_loan_id_step_key" ON "public"."loan_approval"("step" ASC, "loan_id" ASC);

-- CreateIndex
CREATE INDEX "loan_request_advisor_idx" ON "public"."loan_request"("advisor_name" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "loan_request_student_idx" ON "public"."loan_request"("student_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "one_open_loan_per_student" ON "public"."loan_request"("student_id" ASC) WHERE (status <> ALL (ARRAY['closed'::loan_status, 'rejected'::loan_status, 'cancelled'::loan_status]));

-- CreateIndex
CREATE INDEX "payment_loan_idx" ON "public"."payment"("loan_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_slip_ref_key" ON "public"."payment"("slip_ref" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "one_executive_only" ON "public"."user_role"("role" ASC) WHERE (role = 'executive'::user_role_name);

-- AddForeignKey
ALTER TABLE "public"."audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."fund_transaction" ADD CONSTRAINT "fund_transaction_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."fund_transaction" ADD CONSTRAINT "fund_transaction_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."installment" ADD CONSTRAINT "installment_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."loan_approval" ADD CONSTRAINT "loan_approval_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "public"."app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."loan_approval" ADD CONSTRAINT "loan_approval_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."loan_request" ADD CONSTRAINT "loan_request_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."loan_request" ADD CONSTRAINT "loan_request_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "public"."installment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_role" ADD CONSTRAINT "user_role_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."app_user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
