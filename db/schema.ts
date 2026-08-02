import { pgTable, index, unique, uuid, text, timestamp, uniqueIndex, foreignKey, check, numeric, smallint, date, bigserial, bigint, jsonb, primaryKey, pgView, integer, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const approvalStep = pgEnum("approval_step", ['advisor', 'admin', 'executive'])
export const decision = pgEnum("decision", ['pending', 'approved', 'returned', 'rejected'])
export const loanStatus = pgEnum("loan_status", ['draft', 'returned', 'pending_advisor', 'pending_admin', 'pending_executive', 'pending_disbursement', 'disbursed', 'closed', 'rejected', 'cancelled'])
export const userRoleName = pgEnum("user_role_name", ['student', 'advisor', 'admin', 'super_admin', 'executive'])


export const appUser = pgTable("app_user", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	studentCode: text("student_code"),
	fullNameTh: text("full_name_th").notNull(),
	fullNameEn: text("full_name_en"),
	phone: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("app_user_full_name_th_idx").using("btree", table.fullNameTh.asc().nullsLast().op("text_ops")),
	unique("app_user_email_key").on(table.email),
	unique("app_user_student_code_key").on(table.studentCode),
]);

export const loanRequest = pgTable("loan_request", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	advisorName: text("advisor_name").notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	approvedAmount: numeric("approved_amount", { precision: 12, scale:  2 }),
	purpose: text().notNull(),
	bankName: text("bank_name").notNull(),
	bankAccountNo: text("bank_account_no").notNull(),
	bankAccountName: text("bank_account_name").notNull(),
	installmentCount: smallint("installment_count").notNull(),
	firstDueDate: date("first_due_date").notNull(),
	status: loanStatus().default('draft').notNull(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	cancelledBy: uuid("cancelled_by"),
	disbursedAt: timestamp("disbursed_at", { withTimezone: true, mode: 'string' }),
	closedAt: timestamp("closed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("loan_request_advisor_idx").using("btree", table.advisorName.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("loan_request_student_idx").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("one_open_loan_per_student").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")).where(sql`(status <> ALL (ARRAY['closed'::loan_status, 'rejected'::loan_status, 'cancelled'::loan_status]))`),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [appUser.id],
			name: "loan_request_student_id_fkey"
		}),
	foreignKey({
			columns: [table.cancelledBy],
			foreignColumns: [appUser.id],
			name: "loan_request_cancelled_by_fkey"
		}),
	check("loan_request_amount_check", sql`amount > (0)::numeric`),
	check("loan_request_check", sql`(approved_amount > (0)::numeric) AND (approved_amount <= amount)`),
	check("loan_request_installment_count_check", sql`(installment_count >= 1) AND (installment_count <= 3)`),
]);

export const loanApproval = pgTable("loan_approval", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	loanId: uuid("loan_id").notNull(),
	step: approvalStep().notNull(),
	decision: decision().default('pending').notNull(),
	decidedBy: uuid("decided_by"),
	decidedAt: timestamp("decided_at", { withTimezone: true, mode: 'string' }),
	comment: text(),
}, (table) => [
	foreignKey({
			columns: [table.loanId],
			foreignColumns: [loanRequest.id],
			name: "loan_approval_loan_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.decidedBy],
			foreignColumns: [appUser.id],
			name: "loan_approval_decided_by_fkey"
		}),
	unique("loan_approval_loan_id_step_key").on(table.step, table.loanId),
	check("decided_rows_have_an_actor", sql`(decision = 'pending'::decision) OR ((decided_by IS NOT NULL) AND (decided_at IS NOT NULL))`),
]);

export const installment = pgTable("installment", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	loanId: uuid("loan_id").notNull(),
	seq: smallint().notNull(),
	dueDate: date("due_date").notNull(),
	amountDue: numeric("amount_due", { precision: 12, scale:  2 }).notNull(),
	amountPaid: numeric("amount_paid", { precision: 12, scale:  2 }).default('0').notNull(),
	settledAt: timestamp("settled_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("installment_due_idx").using("btree", table.dueDate.asc().nullsLast().op("date_ops")).where(sql`(settled_at IS NULL)`),
	foreignKey({
			columns: [table.loanId],
			foreignColumns: [loanRequest.id],
			name: "installment_loan_id_fkey"
		}).onDelete("cascade"),
	unique("installment_loan_id_seq_key").on(table.seq, table.loanId),
	check("installment_amount_due_check", sql`amount_due >= (0)::numeric`),
	check("installment_seq_check", sql`(seq >= 1) AND (seq <= 3)`),
	check("installment_amount_paid_check", sql`amount_paid >= (0)::numeric`),
]);

export const payment = pgTable("payment", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	loanId: uuid("loan_id").notNull(),
	installmentId: bigint("installment_id", { mode: "number" }),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	slipUrl: text("slip_url"),
	slipRef: text("slip_ref"),
	slipOcrStatus: text("slip_ocr_status").default('pending').notNull(),
	ocrAmount: numeric("ocr_amount", { precision: 12, scale:  2 }),
	ocrPaidAt: timestamp("ocr_paid_at", { withTimezone: true, mode: 'string' }),
	slipOcrRaw: jsonb("slip_ocr_raw"),
	status: text().default('pending_review').notNull(),
	confirmedBy: uuid("confirmed_by"),
	confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payment_loan_idx").using("btree", table.loanId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.loanId],
			foreignColumns: [loanRequest.id],
			name: "payment_loan_id_fkey"
		}),
	foreignKey({
			columns: [table.installmentId],
			foreignColumns: [installment.id],
			name: "payment_installment_id_fkey"
		}),
	foreignKey({
			columns: [table.confirmedBy],
			foreignColumns: [appUser.id],
			name: "payment_confirmed_by_fkey"
		}),
	unique("payment_slip_ref_key").on(table.slipRef),
	check("payment_amount_check", sql`amount > (0)::numeric`),
	check("payment_slip_ocr_status_check", sql`slip_ocr_status = ANY (ARRAY['pending'::text, 'verified'::text, 'failed'::text, 'manual'::text])`),
	check("payment_status_check", sql`status = ANY (ARRAY['pending_review'::text, 'confirmed'::text, 'rejected'::text])`),
]);

export const fundTransaction = pgTable("fund_transaction", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	kind: text().notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	direction: smallint().notNull(),
	loanId: uuid("loan_id"),
	performedBy: uuid("performed_by").notNull(),
	slipUrl: text("slip_url"),
	note: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fund_transaction_loan_idx").using("btree", table.loanId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.loanId],
			foreignColumns: [loanRequest.id],
			name: "fund_transaction_loan_id_fkey"
		}),
	foreignKey({
			columns: [table.performedBy],
			foreignColumns: [appUser.id],
			name: "fund_transaction_performed_by_fkey"
		}),
	check("fund_transaction_kind_check", sql`kind = ANY (ARRAY['top_up'::text, 'disburse'::text, 'repayment'::text, 'adjustment'::text])`),
	check("fund_transaction_amount_check", sql`amount > (0)::numeric`),
	check("fund_transaction_direction_check", sql`direction = ANY (ARRAY['-1'::integer, 1])`),
]);

export const auditLog = pgTable("audit_log", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	actorId: uuid("actor_id").notNull(),
	action: text().notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	before: jsonb(),
	after: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("audit_log_entity_idx").using("btree", table.entityType.asc().nullsLast().op("text_ops"), table.entityId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [appUser.id],
			name: "audit_log_actor_id_fkey"
		}),
]);

export const userRole = pgTable("user_role", {
	userId: uuid("user_id").notNull(),
	role: userRoleName().notNull(),
	grantedBy: uuid("granted_by"),
	grantedAt: timestamp("granted_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("one_executive_only").using("btree", table.role.asc().nullsLast().op("enum_ops")).where(sql`(role = 'executive'::user_role_name)`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [appUser.id],
			name: "user_role_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.grantedBy],
			foreignColumns: [appUser.id],
			name: "user_role_granted_by_fkey"
		}),
	primaryKey({ columns: [table.userId, table.role], name: "user_role_pkey"}),
]);
export const studentConduct = pgView("student_conduct", {	studentId: uuid("student_id"),
	overdueCount: bigint("overdue_count", { mode: "number" }),
	latePaymentCount: bigint("late_payment_count", { mode: "number" }),
	maxDaysLate: integer("max_days_late"),
	isDelinquent: boolean("is_delinquent"),
}).as(sql`SELECT l.student_id, count(*) FILTER (WHERE i.settled_at IS NULL AND i.due_date < CURRENT_DATE) AS overdue_count, count(*) FILTER (WHERE i.settled_at IS NOT NULL AND i.settled_at::date > i.due_date) AS late_payment_count, COALESCE(max(CURRENT_DATE - i.due_date) FILTER (WHERE i.settled_at IS NULL AND i.due_date < CURRENT_DATE), 0) AS max_days_late, count(*) FILTER (WHERE i.settled_at IS NULL AND i.due_date < CURRENT_DATE) > 0 AS is_delinquent FROM loan_request l JOIN installment i ON i.loan_id = l.id GROUP BY l.student_id`);
