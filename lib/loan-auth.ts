import "server-only";

import { redirect } from "next/navigation";
import { getCmuDisplayName, getCmuSession, type CmuProfile, type CmuSession } from "@/lib/cmu-auth";
import { getNurseAccessDecision } from "@/lib/nurse-auth";
import { isDevelopmentApiAccess, isDevelopmentEnvironment } from "@/lib/development-access";
import { prisma } from "@/lib/prisma";
import type { AppUser, UserRoleName } from "@/lib/generated/prisma/client";

const STUDENT_ID_KEYS = ["student_id", "studentId", "student_code", "studentCode"];
const EMAIL_KEYS = ["email", "mail", "email_address", "cmuitaccount", "cmuitaccount_name"];
const CMU_ACCOUNT_KEYS = ["cmuitaccount", "cmuitaccount_name", "cmu_account", "cmuAccount"];

export type LoanIdentity = {
  cmuAccount: string | null;
  email: string | null;
  studentCode: string | null;
  displayName: string;
};

export type LoanUserContext = {
  session: CmuSession;
  profile: CmuProfile;
  identity: LoanIdentity;
  user: AppUser & { roles: { role: UserRoleName }[] };
};

export type LoanSessionContext = {
  session: CmuSession;
  profile: CmuProfile;
  identity: LoanIdentity;
};

function profileText(profile: CmuProfile, keys: string[]) {
  for (const key of keys) {
    const value = profile[key];
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }

  return "";
}

export function normalizeLoanIdentity(profile: CmuProfile): LoanIdentity {
  const cmuAccount = profileText(profile, CMU_ACCOUNT_KEYS).toLowerCase() || null;
  const email = profileText(profile, EMAIL_KEYS).toLowerCase() || null;
  const studentCode = profileText(profile, STUDENT_ID_KEYS) || null;

  return {
    cmuAccount,
    email: email?.includes("@") ? email : null,
    studentCode,
    displayName: getCmuDisplayName(profile).trim() || "CMU user",
  };
}

export async function resolveStudentIdentity(identity: LoanIdentity) {
  if (!identity.cmuAccount && !identity.email && !identity.studentCode) return null;

  return prisma.appUser.findFirst({
    where: {
      ...(identity.cmuAccount
        ? { cmuAccount: identity.cmuAccount }
        : {
            OR: [
              ...(identity.email ? [{ email: identity.email }] : []),
              ...(identity.studentCode ? [{ studentCode: identity.studentCode }] : []),
            ],
          }),
    },
    include: { roles: { select: { role: true } } },
  });
}

export async function resolveStoredStudent(identity: LoanIdentity) {
  const user = await resolveStudentIdentity(identity);
  if (!user || !user.studentCode || !user.roles.some(({ role }) => role === "student")) {
    return null;
  }

  return user;
}

export async function resolveAdvisor(identity: LoanIdentity, advisorName?: string) {
  const user = await resolveStudentIdentity(identity);
  if (!user || !user.roles.some(({ role }) => role === "advisor")) return null;
  if (advisorName && user.fullNameTh !== advisorName.trim()) return null;
  return user;
}

async function getDevelopmentLoanContext(
  role: "admin" | "advisor" | "executive" | "super_admin" | "staff",
) {
  const user = await prisma.appUser.findFirst({
    where: {
      roles:
        role === "staff"
          ? { some: { role: { in: ["admin", "super_admin", "executive", "advisor"] } } }
          : role === "admin"
            ? { some: { role: { in: ["admin", "super_admin"] } } }
            : { some: { role } },
      ...(role === "advisor" ? { advisorLoans: { some: {} } } : {}),
    },
    include: { roles: { select: { role: true } } },
    orderBy: { id: "asc" },
  });
  if (!user) return null;

  const profile: CmuProfile = {
    cmuitaccount: user.cmuAccount,
    email: user.email,
    ...(user.studentCode ? { student_id: user.studentCode } : {}),
  };
  const now = Date.now();

  return {
    session: { profile, loggedInAt: now, expiresAt: now + 60_000 },
    profile,
    identity: {
      cmuAccount: user.cmuAccount,
      email: user.email,
      studentCode: user.studentCode,
      displayName: user.fullNameTh,
    },
    user,
  } satisfies LoanUserContext;
}

export async function getStudentContext(): Promise<LoanUserContext | null> {
  const context = await getStudentSessionContext();
  if (!context) return null;
  const user = await resolveStoredStudent(context.identity);
  if (!user) return null;

  return { ...context, user };
}

export async function getStudentSessionContext(): Promise<LoanSessionContext | null> {
  const session = await getCmuSession();
  if (!session) {
    console.info("Student session rejected", { reason: "missing_or_invalid_session" });
    return null;
  }

  const identity = normalizeLoanIdentity(session.profile);
  if (!identity.studentCode) {
    console.info("Student session rejected", { reason: "missing_student_id" });
    return null;
  }

  if (!isDevelopmentEnvironment()) {
    const access = getNurseAccessDecision(session.profile);
    if (!access.allowed) {
      console.info("Student session rejected", { reason: access.reason });
      return null;
    }
  }

  return { session, profile: session.profile, identity };
}

export async function getAdvisorContext(advisorName?: string): Promise<LoanUserContext | null> {
  if (isDevelopmentApiAccess()) return getDevelopmentLoanContext("advisor");

  const session = await getCmuSession();
  if (!session) return null;

  const identity = normalizeLoanIdentity(session.profile);
  const user = await resolveAdvisor(identity, advisorName);
  if (!user) return null;

  return { session, profile: session.profile, identity, user };
}

export type AdminAccess =
  | { status: "authorized"; context: LoanUserContext }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

function hasAdminRole(roles: { role: UserRoleName }[]) {
  return roles.some(({ role }) => role === "admin" || role === "super_admin");
}

export type ExecutiveAccess =
  | { status: "authorized"; context: LoanUserContext }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

export type SuperAdminAccess =
  | { status: "authorized"; context: LoanUserContext }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

function hasExecutiveRole(roles: { role: UserRoleName }[]) {
  return roles.some(({ role }) => role === "executive");
}

function hasSuperAdminRole(roles: { role: UserRoleName }[]) {
  return roles.some(({ role }) => role === "super_admin");
}

export async function getAdminAccess(): Promise<AdminAccess> {
  if (isDevelopmentApiAccess()) {
    const context = await getDevelopmentLoanContext("admin");
    return context ? { status: "authorized", context } : { status: "forbidden" };
  }

  const session = await getCmuSession();
  if (!session) return { status: "unauthenticated" };

  const identity = normalizeLoanIdentity(session.profile);
  const user = await resolveStudentIdentity(identity);
  if (!user || !hasAdminRole(user.roles)) return { status: "forbidden" };

  return {
    status: "authorized",
    context: { session, profile: session.profile, identity, user },
  };
}

export async function getAdminContext(): Promise<LoanUserContext | null> {
  const access = await getAdminAccess();
  return access.status === "authorized" ? access.context : null;
}

export async function getSuperAdminAccess(): Promise<SuperAdminAccess> {
  if (isDevelopmentApiAccess()) {
    const context = await getDevelopmentLoanContext("super_admin");
    return context ? { status: "authorized", context } : { status: "forbidden" };
  }

  const session = await getCmuSession();
  if (!session) return { status: "unauthenticated" };

  const identity = normalizeLoanIdentity(session.profile);
  const user = await resolveStudentIdentity(identity);
  if (!user || !hasSuperAdminRole(user.roles)) return { status: "forbidden" };

  return {
    status: "authorized",
    context: { session, profile: session.profile, identity, user },
  };
}

export async function getDevelopmentStaffContext() {
  if (!isDevelopmentApiAccess()) return null;
  return getDevelopmentLoanContext("staff");
}

export async function getExecutiveAccess(): Promise<ExecutiveAccess> {
  if (isDevelopmentApiAccess()) {
    const context = await getDevelopmentLoanContext("executive");
    return context ? { status: "authorized", context } : { status: "forbidden" };
  }

  const session = await getCmuSession();
  if (!session) return { status: "unauthenticated" };

  const identity = normalizeLoanIdentity(session.profile);
  const user = await resolveStudentIdentity(identity);

  if (!user || !hasExecutiveRole(user.roles)) {
    return { status: "forbidden" };
  }

  return {
    status: "authorized",
    context: {
      session,
      profile: session.profile,
      identity,
      user,
    },
  };
}

export async function getExecutiveContext(): Promise<LoanUserContext | null> {
  const access = await getExecutiveAccess();
  return access.status === "authorized" ? access.context : null;
}

export async function requireExecutiveAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  const access = await getExecutiveAccess();

  if (access.status === "unauthenticated") {
    redirect(loginRedirectUrl);
  }

  if (access.status === "forbidden") {
    redirect(errorRedirectUrl);
  }

  return access.context;
}

export async function requireAdminAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  const access = await getAdminAccess();

  if (access.status === "unauthenticated") {
    redirect(loginRedirectUrl);
  }

  if (access.status === "forbidden") {
    redirect(errorRedirectUrl);
  }

  return access.context;
}

export async function requireSuperAdminAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  const access = await getSuperAdminAccess();

  if (access.status === "unauthenticated") {
    redirect(loginRedirectUrl);
  }

  if (access.status === "forbidden") {
    redirect(errorRedirectUrl);
  }

  return access.context;
}

export async function requireAdvisorAccess(
  advisorName?: string,
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  const session = await getCmuSession();
  if (!session) {
    redirect(loginRedirectUrl);
  }

  const context = await getAdvisorContext(advisorName);
  if (!context) {
    redirect(errorRedirectUrl);
  }

  return context;
}

export async function requireStudentAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  const session = await getCmuSession();
  if (!session) {
    redirect(loginRedirectUrl);
  }

  const context = await getStudentContext();
  if (!context) {
    redirect(errorRedirectUrl);
  }

  return context;
}
