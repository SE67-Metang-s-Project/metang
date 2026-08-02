-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."approval_step" AS ENUM('advisor', 'admin', 'executive');--> statement-breakpoint
CREATE TYPE "public"."decision" AS ENUM('pending', 'approved', 'returned', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('draft', 'returned', 'pending_advisor', 'pending_admin', 'pending_executive', 'pending_disbursement', 'disbursed', 'closed', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role_name" AS ENUM('student', 'advisor', 'admin', 'super_admin', 'executive');--> statement-breakpoint
CREATE TABLE "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entra_oid" text NOT NULL,
	"email" text NOT NULL,
	"student_code" text,
	"full_name_th" text NOT NULL,
	"full_name_en" text,
	"phone" text,
	"advisor_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_entra_oid_key" UNIQUE("entra_oid"),
	CONSTRAINT "app_user_email_key" UNIQUE("email"),
	CONSTRAINT "app_user_student_code_key" UNIQUE("student_code")
);
--> statement-breakpoint
CREATE TABLE "loan_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"advisor_name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"approved_amount" numeric(12, 2),
	"amount_in_words" text NOT NULL,
	"purpose" text NOT NULL,
	"bank_name" text NOT NULL,
	"bank_account_no" text NOT NULL,
	"bank_account_name" text NOT NULL,
	"installment_count" smallint NOT NULL,
	"first_due_date" date NOT NULL,
	"status" "loan_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"disbursed_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loan_request_amount_check" CHECK (amount > (0)::numeric),
	CONSTRAINT "loan_request_check" CHECK ((approved_amount > (0)::numeric) AND (approved_amount <= amount)),
	CONSTRAINT "loan_request_installment_count_check" CHECK ((installment_count >= 1) AND (installment_count <= 3))
);
--> statement-breakpoint
CREATE TABLE "loan_approval" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"loan_id" uuid NOT NULL,
	"step" "approval_step" NOT NULL,
	"decision" "decision" DEFAULT 'pending' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"comment" text,
	CONSTRAINT "loan_approval_loan_id_step_key" UNIQUE("step","loan_id"),
	CONSTRAINT "decided_rows_have_an_actor" CHECK ((decision = 'pending'::decision) OR ((decided_by IS NOT NULL) AND (decided_at IS NOT NULL)))
);
--> statement-breakpoint
CREATE TABLE "installment" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"loan_id" uuid NOT NULL,
	"seq" smallint NOT NULL,
	"due_date" date NOT NULL,
	"amount_due" numeric(12, 2) NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"settled_at" timestamp with time zone,
	CONSTRAINT "installment_loan_id_seq_key" UNIQUE("seq","loan_id"),
	CONSTRAINT "installment_amount_due_check" CHECK (amount_due >= (0)::numeric),
	CONSTRAINT "installment_seq_check" CHECK ((seq >= 1) AND (seq <= 3)),
	CONSTRAINT "installment_amount_paid_check" CHECK (amount_paid >= (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"loan_id" uuid NOT NULL,
	"installment_id" bigint,
	"amount" numeric(12, 2) NOT NULL,
	"slip_url" text,
	"slip_ref" text,
	"slip_ocr_status" text DEFAULT 'pending' NOT NULL,
	"ocr_amount" numeric(12, 2),
	"ocr_paid_at" timestamp with time zone,
	"slip_ocr_raw" jsonb,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"confirmed_by" uuid,
	"confirmed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_slip_ref_key" UNIQUE("slip_ref"),
	CONSTRAINT "payment_amount_check" CHECK (amount > (0)::numeric),
	CONSTRAINT "payment_slip_ocr_status_check" CHECK (slip_ocr_status = ANY (ARRAY['pending'::text, 'verified'::text, 'failed'::text, 'manual'::text])),
	CONSTRAINT "payment_status_check" CHECK (status = ANY (ARRAY['pending_review'::text, 'confirmed'::text, 'rejected'::text]))
);
--> statement-breakpoint
CREATE TABLE "fund_transaction" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"direction" smallint NOT NULL,
	"loan_id" uuid,
	"performed_by" uuid NOT NULL,
	"slip_url" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fund_transaction_kind_check" CHECK (kind = ANY (ARRAY['top_up'::text, 'disburse'::text, 'repayment'::text, 'adjustment'::text])),
	CONSTRAINT "fund_transaction_amount_check" CHECK (amount > (0)::numeric),
	CONSTRAINT "fund_transaction_direction_check" CHECK (direction = ANY (ARRAY['-1'::integer, 1]))
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" text DEFAULT 'line' NOT NULL,
	"template" text NOT NULL,
	"payload" jsonb,
	"deep_link" text,
	"sent_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_channel_check" CHECK (channel = ANY (ARRAY['line'::text, 'email'::text]))
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"user_id" uuid NOT NULL,
	"role" "user_role_name" NOT NULL,
	"granted_by" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_role_pkey" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_request" ADD CONSTRAINT "loan_request_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_approval" ADD CONSTRAINT "loan_approval_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_approval" ADD CONSTRAINT "loan_approval_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment" ADD CONSTRAINT "installment_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "public"."installment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_transaction" ADD CONSTRAINT "fund_transaction_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "public"."loan_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_transaction" ADD CONSTRAINT "fund_transaction_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."app_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_user_full_name_th_idx" ON "app_user" USING btree ("full_name_th" text_ops);--> statement-breakpoint
CREATE INDEX "loan_request_advisor_idx" ON "loan_request" USING btree ("advisor_name" text_ops,"status" enum_ops);--> statement-breakpoint
CREATE INDEX "loan_request_student_idx" ON "loan_request" USING btree ("student_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "one_open_loan_per_student" ON "loan_request" USING btree ("student_id" uuid_ops) WHERE (status <> ALL (ARRAY['closed'::loan_status, 'rejected'::loan_status, 'cancelled'::loan_status]));--> statement-breakpoint
CREATE INDEX "installment_due_idx" ON "installment" USING btree ("due_date" date_ops) WHERE (settled_at IS NULL);--> statement-breakpoint
CREATE INDEX "payment_loan_idx" ON "payment" USING btree ("loan_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "fund_transaction_loan_idx" ON "fund_transaction" USING btree ("loan_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "notification_unsent_idx" ON "notification" USING btree ("created_at" timestamptz_ops) WHERE (sent_at IS NULL);--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type" text_ops,"entity_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "one_executive_only" ON "user_role" USING btree ("role" enum_ops) WHERE (role = 'executive'::user_role_name);--> statement-breakpoint
CREATE VIEW "public"."student_conduct" AS (SELECT l.student_id, count(*) FILTER (WHERE i.settled_at IS NULL AND i.due_date < CURRENT_DATE) AS overdue_count, count(*) FILTER (WHERE i.settled_at IS NOT NULL AND i.settled_at::date > i.due_date) AS late_payment_count, COALESCE(max(CURRENT_DATE - i.due_date) FILTER (WHERE i.settled_at IS NULL AND i.due_date < CURRENT_DATE), 0) AS max_days_late, count(*) FILTER (WHERE i.settled_at IS NULL AND i.due_date < CURRENT_DATE) > 0 AS is_delinquent FROM loan_request l JOIN installment i ON i.loan_id = l.id GROUP BY l.student_id);
*/