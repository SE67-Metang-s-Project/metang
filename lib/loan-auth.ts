import "server-only";

import { redirect } from "next/navigation";
import { getCmuDisplayName, getCmuSession, type CmuProfile, type CmuSession } from "@/lib/cmu-auth";
import { getNurseAccessDecision } from "@/lib/nurse-auth";
import {
  isDevelopmentApiBypass,
  isDevelopmentEnvironment,
  isDevelopmentRoleEnabled,
  type DevelopmentApiRole,
} from "@/lib/development-access";
import { prisma } from "@/lib/prisma";
import type { AppUser, UserRoleName } from "@/lib/generated/prisma/client";

const STUDENT_ID_KEYS = ["student_id", "studentId", "student_code", "studentCode"];
const EMAIL_KEYS = ["email", "mail", "email_address", "cmuitaccount", "cmuitaccount_name"];
const CMU_ACCOUNT_KEYS = ["cmuitaccount_name", "cmuitaccount", "cmu_account", "cmuAccount"];

const DEVELOPMENT_USER_IDS: Record<DevelopmentApiRole, string> = {
  executive: "00000000-0000-0000-0000-000000000001",
  super_admin: "00000000-0000-0000-0000-000000000002",
  admin: "00000000-0000-0000-0000-000000000003",
  advisor: "00000000-0000-0000-0000-000000000004",
};
const DEVELOPMENT_STUDENT_ID = "00000000-0000-0000-0000-000000000101";
const DEVELOPMENT_API_ROLES: DevelopmentApiRole[] = ["advisor", "admin", "super_admin", "executive"];

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
  const rawAccount = profileText(profile, CMU_ACCOUNT_KEYS).toLowerCase();
  const cmuAccount = rawAccount ? rawAccount.split("@")[0] : null;
  const email = profileText(profile, EMAIL_KEYS).toLowerCase() || null;
  const studentCode = profileText(profile, STUDENT_ID_KEYS) || null;

  return {
    cmuAccount,
    email: email?.includes("@") ? email : (cmuAccount ? `${cmuAccount}@cmu.ac.th` : null),
    studentCode,
    displayName: getCmuDisplayName(profile).trim() || "CMU user",
  };
}

export async function resolveStudentIdentity(identity: LoanIdentity) {
  if (!identity.cmuAccount && !identity.email && !identity.studentCode) return null;

  return prisma.appUser.findFirst({
    where: {
      OR: [
        ...(identity.cmuAccount ? [{ cmuAccount: identity.cmuAccount }] : []),
        ...(identity.email ? [{ email: identity.email }] : []),
        ...(identity.studentCode ? [{ studentCode: identity.studentCode }] : []),
      ],
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

function createDevelopmentLoanContext(user: LoanUserContext["user"]): LoanUserContext {
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
  };
}

async function getDevelopmentStudentContext(): Promise<LoanUserContext | null> {
  if (!isDevelopmentApiBypass()) return null;

  const user = await prisma.appUser.findUnique({
    where: { id: DEVELOPMENT_STUDENT_ID },
    include: { roles: { select: { role: true } } },
  });
  if (!user || !user.studentCode || !user.roles.some(({ role }) => role === "student")) return null;

  return createDevelopmentLoanContext(user);
}

async function getDevelopmentLoanContext(
  role: "admin" | "advisor" | "executive" | "super_admin" | "staff",
) {
  const bypass = isDevelopmentApiBypass();
  const developmentRole =
    role === "staff"
      ? DEVELOPMENT_API_ROLES.find((candidate) => bypass || isDevelopmentRoleEnabled(candidate))
      : role;
  if (!developmentRole || (!bypass && !isDevelopmentRoleEnabled(developmentRole))) return null;

  const user = await prisma.appUser.findUnique({
    where: {
      id: DEVELOPMENT_USER_IDS[developmentRole],
    },
    include: { roles: { select: { role: true } } },
  });
  if (!user) return null;
  const hasRequestedRole =
    role === "staff"
      ? user.roles.some(({ role: userRole }) => DEVELOPMENT_API_ROLES.some((role) => role === userRole))
      : role === "admin"
        ? hasAdminRole(user.roles)
        : user.roles.some(({ role: userRole }) => userRole === role);
  if (!hasRequestedRole) return null;

  return createDevelopmentLoanContext(user);
}

export async function getStudentContext(): Promise<LoanUserContext | null> {
  if (isDevelopmentApiBypass()) return getDevelopmentStudentContext();

  const context = await getStudentSessionContext();
  if (!context) return null;
  const user = await resolveStoredStudent(context.identity);
  if (!user) return null;

  return { ...context, user };
}

export async function getStudentSessionContext(): Promise<LoanSessionContext | null> {
  if (isDevelopmentApiBypass()) {
    const context = await getDevelopmentStudentContext();
    if (!context) return null;
    return { session: context.session, profile: context.profile, identity: context.identity };
  }

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

export type RoleAccess =
  | { status: "authorized"; context: LoanUserContext }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

export type AdvisorAccess = RoleAccess;
export type AdminAccess = RoleAccess;
export type ExecutiveAccess = RoleAccess;
export type SuperAdminAccess = RoleAccess;

export async function getAdvisorAccess(advisorName?: string): Promise<AdvisorAccess> {
  if (isDevelopmentApiBypass() || isDevelopmentRoleEnabled("advisor")) {
    const context = await getDevelopmentLoanContext("advisor");
    return context ? { status: "authorized", context } : { status: "forbidden" };
  }

  const session = await getCmuSession();
  if (!session) return { status: "unauthenticated" };

  const identity = normalizeLoanIdentity(session.profile);
  const user = await resolveAdvisor(identity, advisorName);
  if (!user) return { status: "forbidden" };

  return {
    status: "authorized",
    context: { session, profile: session.profile, identity, user },
  };
}

export async function getAdvisorContext(advisorName?: string): Promise<LoanUserContext | null> {
  const access = await getAdvisorAccess(advisorName);
  return access.status === "authorized" ? access.context : null;
}

function hasAdminRole(roles: { role: UserRoleName }[]) {
  return roles.some(({ role }) => role === "admin" || role === "super_admin");
}

function hasExecutiveRole(roles: { role: UserRoleName }[]) {
  return roles.some(({ role }) => role === "executive");
}

function hasSuperAdminRole(roles: { role: UserRoleName }[]) {
  return roles.some(({ role }) => role === "super_admin");
}

export async function getAdminAccess(): Promise<AdminAccess> {
  if (isDevelopmentApiBypass() || isDevelopmentRoleEnabled("admin")) {
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
  if (isDevelopmentApiBypass() || isDevelopmentRoleEnabled("super_admin")) {
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
  if (
    !isDevelopmentApiBypass() &&
    !DEVELOPMENT_API_ROLES.some((role) => isDevelopmentRoleEnabled(role))
  ) return null;
  return getDevelopmentLoanContext("staff");
}

export async function getExecutiveAccess(): Promise<ExecutiveAccess> {
  if (isDevelopmentApiBypass() || isDevelopmentRoleEnabled("executive")) {
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

export async function getStudentAccess(): Promise<RoleAccess> {
  const session = await getCmuSession();
  if (!session) return { status: "unauthenticated" };

  const context = await getStudentContext();
  if (!context) return { status: "forbidden" };

  return { status: "authorized", context };
}

async function requireRoleAccess(
  accessPromise: Promise<RoleAccess>,
  errorRedirectUrl: string,
  loginRedirectUrl: string,
): Promise<LoanUserContext> {
  const access = await accessPromise;

  if (access.status === "unauthenticated") {
    redirect(loginRedirectUrl);
  }

  if (access.status === "forbidden") {
    redirect(errorRedirectUrl);
  }

  return access.context;
}

export async function requireExecutiveAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  return requireRoleAccess(getExecutiveAccess(), errorRedirectUrl, loginRedirectUrl);
}

export async function requireAdminAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  return requireRoleAccess(getAdminAccess(), errorRedirectUrl, loginRedirectUrl);
}

export async function requireSuperAdminAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  return requireRoleAccess(getSuperAdminAccess(), errorRedirectUrl, loginRedirectUrl);
}

export async function requireAdvisorAccess(
  advisorName?: string,
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  return requireRoleAccess(getAdvisorAccess(advisorName), errorRedirectUrl, loginRedirectUrl);
}

export async function requireStudentAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/error?type=unauthenticated",
): Promise<LoanUserContext> {
  return requireRoleAccess(getStudentAccess(), errorRedirectUrl, loginRedirectUrl);
}
