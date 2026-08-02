import { relations } from "drizzle-orm/relations";
import { appUser, loanRequest, loanApproval, installment, payment, fundTransaction, auditLog, userRole } from "./schema";

export const loanRequestRelations = relations(loanRequest, ({one, many}) => ({
	appUser_studentId: one(appUser, {
		fields: [loanRequest.studentId],
		references: [appUser.id],
		relationName: "loanRequest_studentId_appUser_id"
	}),
	appUser_cancelledBy: one(appUser, {
		fields: [loanRequest.cancelledBy],
		references: [appUser.id],
		relationName: "loanRequest_cancelledBy_appUser_id"
	}),
	loanApprovals: many(loanApproval),
	installments: many(installment),
	payments: many(payment),
	fundTransactions: many(fundTransaction),
}));

export const appUserRelations = relations(appUser, ({many}) => ({
	loanRequests_studentId: many(loanRequest, {
		relationName: "loanRequest_studentId_appUser_id"
	}),
	loanRequests_cancelledBy: many(loanRequest, {
		relationName: "loanRequest_cancelledBy_appUser_id"
	}),
	loanApprovals: many(loanApproval),
	payments: many(payment),
	fundTransactions: many(fundTransaction),
	auditLogs: many(auditLog),
	userRoles_userId: many(userRole, {
		relationName: "userRole_userId_appUser_id"
	}),
	userRoles_grantedBy: many(userRole, {
		relationName: "userRole_grantedBy_appUser_id"
	}),
}));

export const loanApprovalRelations = relations(loanApproval, ({one}) => ({
	loanRequest: one(loanRequest, {
		fields: [loanApproval.loanId],
		references: [loanRequest.id]
	}),
	appUser: one(appUser, {
		fields: [loanApproval.decidedBy],
		references: [appUser.id]
	}),
}));

export const installmentRelations = relations(installment, ({one, many}) => ({
	loanRequest: one(loanRequest, {
		fields: [installment.loanId],
		references: [loanRequest.id]
	}),
	payments: many(payment),
}));

export const paymentRelations = relations(payment, ({one}) => ({
	loanRequest: one(loanRequest, {
		fields: [payment.loanId],
		references: [loanRequest.id]
	}),
	installment: one(installment, {
		fields: [payment.installmentId],
		references: [installment.id]
	}),
	appUser: one(appUser, {
		fields: [payment.confirmedBy],
		references: [appUser.id]
	}),
}));

export const fundTransactionRelations = relations(fundTransaction, ({one}) => ({
	loanRequest: one(loanRequest, {
		fields: [fundTransaction.loanId],
		references: [loanRequest.id]
	}),
	appUser: one(appUser, {
		fields: [fundTransaction.performedBy],
		references: [appUser.id]
	}),
}));

export const auditLogRelations = relations(auditLog, ({one}) => ({
	appUser: one(appUser, {
		fields: [auditLog.actorId],
		references: [appUser.id]
	}),
}));

export const userRoleRelations = relations(userRole, ({one}) => ({
	appUser_userId: one(appUser, {
		fields: [userRole.userId],
		references: [appUser.id],
		relationName: "userRole_userId_appUser_id"
	}),
	appUser_grantedBy: one(appUser, {
		fields: [userRole.grantedBy],
		references: [appUser.id],
		relationName: "userRole_grantedBy_appUser_id"
	}),
}));
