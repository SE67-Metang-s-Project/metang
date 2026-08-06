import { prisma } from "@/lib/prisma";

export async function getAllStudents() {
  return prisma.appUser.findMany({
    where: { studentCode: { not: null } },
    orderBy: { fullNameTh: "asc" },
    select: {
      id: true,
      studentCode: true,
      fullNameTh: true,
    },
  });
}

export async function getAllLoanRequest() {
  return prisma.loanRequest.findMany({ orderBy: { createdAt: "asc" } });
}
