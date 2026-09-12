import { prisma } from "@/lib/prisma";
import { UserRoleName } from "@/lib/generated/prisma/client";

export async function getAdvisorRecipientEmail(advisorId: string): Promise<string> {
  const user = await prisma.appUser.findUniqueOrThrow({
    where: { id: advisorId },
    select: { email: true },
  });
  return user.email;
}

export async function getAdminRecipientEmails(assignedAdminId: string | null): Promise<string[]> {
  if (assignedAdminId) {
    const user = await prisma.appUser.findUniqueOrThrow({
      where: { id: assignedAdminId },
      select: { email: true },
    });
    return [user.email];
  }

  const users = await prisma.appUser.findMany({
    where: {
      roles: {
        some: {
          role: { in: [UserRoleName.admin, UserRoleName.super_admin] },
        },
      },
    },
    select: { email: true },
  });
  return users.map((u) => u.email);
}

export async function getExecutiveRecipientEmail(): Promise<string | null> {
  const user = await prisma.appUser.findFirst({
    where: {
      roles: {
        some: { role: UserRoleName.executive },
      },
    },
    select: { email: true },
  });
  return user?.email ?? null;
}

export async function getLoanRoutingIds(
  loanId: string,
): Promise<{ advisorId: string; assignedAdminId: string | null } | null> {
  return prisma.loanRequest.findUnique({
    where: { id: loanId },
    select: { advisorId: true, assignedAdminId: true },
  });
}
