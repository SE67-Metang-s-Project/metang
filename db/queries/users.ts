import { asc, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { appUser, loanRequest } from "@/db/schema";

export async function getAllStudents() {
  return db
    .selectDistinct({
      id: appUser.id,
      studentCode: appUser.studentCode,
      fullNameTh: appUser.fullNameTh,
    })
    .from(appUser)
    .where(isNotNull(appUser.studentCode))
    .orderBy(asc(appUser.fullNameTh));
}

export async function getAllLoanRequest() {
  return db.select().from(loanRequest).orderBy(asc(loanRequest.createdAt));
}
