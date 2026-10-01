import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getCmuDisplayName,
  getCmuNames,
  getCmuSession,
  getProfileText,
  type CmuProfile,
  type CmuSession,
} from "@/lib/cmu-auth";
import { getNurseAccessDecision } from "@/lib/nurse-auth";
import {
  getDevelopmentHomePath,
  getDevelopmentRoleUserId,
  isDevelopmentApiBypass,
  isDevelopmentEnvironment,
  isDevelopmentRoleEnabled,
  type DevelopmentApiRole,
} from "@/lib/development-access";
import { prisma } from "@/lib/prisma";
import { RETURN_PATH_HEADER, sanitizeReturnPath } from "@/lib/return-path";
import { getEducationLevelCode, getEducationLevelName } from "@/lib/student-code";
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
// The dev-bypass student: seed fixture student 101, who owns loan REQ202609060001.
const DEVELOPMENT_STUDENT_PROFILE: CmuProfile = {
  cmuitaccount_name: "pimchanok.sukprasert",
  cmuitaccount: "pimchanok.sukprasert@cmu.ac.th",
  student_id: "670610143",
  firstname_TH: "พิมพ์ชนก",
  lastname_TH: "สุขประเสริฐ",
  firstname_EN: "Pimchanok",
  lastname_EN: "Sukprasert",
};
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

export type StudentSessionContext = LoanSessionContext & {
  identity: LoanIdentity & { studentCode: string };
};

/**
 * A student has no app_user row: this is built from the CMU session, and `id` is the student
 * code, the key loan_request.student_code and audit_log.actor_student_code hold.
 */
export type StudentUser = {
  id: string;
  studentCode: string;
  email: string | null;
  fullNameTh: string;
  fullNameEn: string | null;
  educationLevel: string | null;
  // The phone the student gave on their latest loan request.
  phone: string | null;
  roles: { role: UserRoleName }[];
};

export type StudentContext = StudentSessionContext & { user: StudentUser };

function profileText(profile: CmuProfile, keys: string[]) {
  for (const key of keys) {
    const text = getProfileText(profile, key);
    if (text) return text;
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

/** The staff app_user row for a CMU identity. Students have none. */
export async function resolveAppUser(identity: LoanIdentity) {
  if (!identity.cmuAccount && !identity.email) return null;

  return prisma.appUser.findFirst({
    where: {
      OR: [
        ...(identity.cmuAccount ? [{ cmuAccount: identity.cmuAccount }] : []),
        ...(identity.email ? [{ email: identity.email }] : []),
      ],
    },
    include: { roles: { select: { role: true } } },
  });
}

async function buildStudentUser(context: StudentSessionContext): Promise<StudentUser> {
  const { studentCode } = context.identity;
  const latest = await prisma.loanRequest.findFirst({
    where: { studentCode },
    orderBy: { createdAt: "desc" },
    select: { studentPhone: true },
  });
  const names = getCmuNames(context.profile);

  return {
    id: studentCode,
    studentCode,
    email: context.identity.email,
    fullNameTh: names.fullNameTh,
    fullNameEn: names.fullNameEn,
    educationLevel: getEducationLevelName(getEducationLevelCode(studentCode)),
    phone: latest?.studentPhone ?? null,
    roles: [{ role: "student" }],
  };
}

export async function resolveAdvisor(identity: LoanIdentity, advisorName?: string) {
  const user = await resolveAppUser(identity);
  if (!user || !user.roles.some(({ role }) => role === "advisor")) return null;
  if (advisorName && user.fullNameTh !== advisorName.trim()) return null;
  return user;
}

function createDevelopmentLoanContext(user: LoanUserContext["user"]): LoanUserContext {
  const profile: CmuProfile = { cmuitaccount: user.cmuAccount, email: user.email };
  const now = Date.now();

  return {
    session: { profile, loggedInAt: now, expiresAt: now + 60_000 },
    profile,
    identity: {
      cmuAccount: user.cmuAccount,
      email: user.email,
      studentCode: null,
      displayName: user.fullNameTh,
    },
    user,
  };
}

function getDevelopmentStudentSession(): StudentSessionContext | null {
  if (!isDevelopmentApiBypass()) return null;

  const profile = DEVELOPMENT_STUDENT_PROFILE;
  const now = Date.now();
  const identity = normalizeLoanIdentity(profile);
  return {
    session: { profile, loggedInAt: now, expiresAt: now + 60_000 },
    profile,
    identity: { ...identity, studentCode: identity.studentCode ?? "" },
  };
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
      // Per-role override (e.g. DEV_ADVISOR_USER_ID) lets a fixture holding more than one role
      // be reached through any single one of its roles' bypass, without disturbing the other
      // roles' own default fixtures.
      id: getDevelopmentRoleUserId(developmentRole) ?? DEVELOPMENT_USER_IDS[developmentRole],
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

export async function getStudentContext(): Promise<StudentContext | null> {
  const context = await getStudentSessionContext();
  if (!context) return null;

  return { ...context, user: await buildStudentUser(context) };
}

export async function getStudentSessionContext(): Promise<StudentSessionContext | null> {
  if (isDevelopmentApiBypass()) return getDevelopmentStudentSession();

  const session = await getCmuSession();
  if (!session) {
    console.info("Student session rejected", { reason: "missing_or_invalid_session" });
    return null;
  }

  const identity = normalizeLoanIdentity(session.profile);
  const { studentCode } = identity;
  if (!studentCode) {
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

  return { session, profile: session.profile, identity: { ...identity, studentCode } };
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
  const user = await resolveAppUser(identity);
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
  const user = await resolveAppUser(identity);
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
  const user = await resolveAppUser(identity);

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

// Dev fixtures are one user per role, so a role-agnostic caller has to pick one; staff first
// because the routes that need this read banking evidence.
const DEVELOPMENT_CONTEXT_PRECEDENCE = ["admin", "super_admin", "executive", "advisor"] as const;

/**
 * Resolves the caller whatever role they hold, for routes that are not scoped to a single role
 * (slip reads, which admin, executive, and the owning student may all perform). One session
 * decrypt and one user lookup, where chaining the per-role getters costs one of each per role.
 * The caller is responsible for authorizing the roles on the returned context.
 */
export async function getSignedInContext(): Promise<LoanUserContext | StudentContext | null> {
  if (isDevelopmentApiBypass() || DEVELOPMENT_API_ROLES.some((role) => isDevelopmentRoleEnabled(role))) {
    for (const role of DEVELOPMENT_CONTEXT_PRECEDENCE) {
      const context = await getDevelopmentLoanContext(role);
      if (context) return context;
    }
    return getStudentContext();
  }

  const session = await getCmuSession();
  if (!session) return null;

  const identity = normalizeLoanIdentity(session.profile);
  const user = await resolveAppUser(identity);
  if (user) return { session, profile: session.profile, identity, user };

  // Not staff: a student is signed in by their session alone.
  return getStudentContext();
}

const FORBIDDEN_HOME_PATH = "/error?type=forbidden";

export function resolveUserHomePath(
  roles: (UserRoleName | string)[],
  profile?: CmuProfile,
): string {
  const roleSet = new Set(roles.map((r) => String(r)));
  if (roleSet.has("super_admin")) return "/superadmin";
  if (roleSet.has("executive")) return "/executive";
  if (roleSet.has("admin")) return "/admin";
  if (roleSet.has("advisor")) return "/advisor";
  if (roleSet.has("student")) return "/student";

  if (profile) {
    const studentCode = profile.student_id || profile.studentId || profile.student_code;
    const isStudent = Boolean(
      studentCode ||
        profile.itaccounttype_id === "StdAcc" ||
        (typeof profile.itaccounttype_TH === "string" && profile.itaccounttype_TH.includes("นักศึกษา")),
    );
    if (isStudent) return "/student";
  }

  return FORBIDDEN_HOME_PATH;
}

/**
 * The signed-in account's own role decides the page. A dev shortcut (DEV_AS_*, DEV_API_BYPASS)
 * only picks the page for an account that holds no role and is not a student.
 */
export async function getUserHomePath(profile: CmuProfile): Promise<string> {
  let homePath: string;
  try {
    const identity = normalizeLoanIdentity(profile);
    const user = await resolveAppUser(identity);
    const roles = user?.roles.map((r) => r.role) ?? [];
    homePath = resolveUserHomePath(roles, profile);
  } catch (error) {
    console.error("Unable to resolve user home path", error);
    homePath = resolveUserHomePath([], profile);
  }

  return homePath === FORBIDDEN_HOME_PATH ? (getDevelopmentHomePath() ?? homePath) : homePath;
}

export type StudentAccess =
  | { status: "authorized"; context: StudentContext }
  | { status: "unauthenticated" }
  | { status: "forbidden" };

export async function getStudentAccess(): Promise<StudentAccess> {
  const session = await getCmuSession();
  if (!session) return { status: "unauthenticated" };

  const context = await getStudentContext();
  if (!context) return { status: "forbidden" };

  return { status: "authorized", context };
}

// Adds ?next=<current page> to the login URL. proxy.ts forwards the current pathname + search in
// RETURN_PATH_HEADER; without a safe value the login URL is returned unchanged.
async function withReturnPath(loginRedirectUrl: string): Promise<string> {
  const returnPath = sanitizeReturnPath((await headers()).get(RETURN_PATH_HEADER));
  if (!returnPath) return loginRedirectUrl;

  const loginUrl = new URL(loginRedirectUrl, "http://localhost");
  loginUrl.searchParams.set("next", returnPath);
  return `${loginUrl.pathname}${loginUrl.search}`;
}

async function requireRoleAccess<Context>(
  accessPromise: Promise<
    { status: "authorized"; context: Context } | { status: "unauthenticated" } | { status: "forbidden" }
  >,
  errorRedirectUrl: string,
  loginRedirectUrl: string,
): Promise<Context> {
  const access = await accessPromise;

  if (access.status === "unauthenticated") {
    redirect(await withReturnPath(loginRedirectUrl));
  }

  if (access.status === "forbidden") {
    redirect(errorRedirectUrl);
  }

  return access.context;
}

export async function requireExecutiveAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/login",
): Promise<LoanUserContext> {
  return requireRoleAccess(getExecutiveAccess(), errorRedirectUrl, loginRedirectUrl);
}

export async function requireAdminAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/login",
): Promise<LoanUserContext> {
  return requireRoleAccess(getAdminAccess(), errorRedirectUrl, loginRedirectUrl);
}

export async function requireSuperAdminAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/login",
): Promise<LoanUserContext> {
  return requireRoleAccess(getSuperAdminAccess(), errorRedirectUrl, loginRedirectUrl);
}

export async function requireAdvisorAccess(
  advisorName?: string,
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/login",
): Promise<LoanUserContext> {
  return requireRoleAccess(getAdvisorAccess(advisorName), errorRedirectUrl, loginRedirectUrl);
}

export async function requireStudentAccess(
  errorRedirectUrl = "/error?type=forbidden",
  loginRedirectUrl = "/login",
): Promise<StudentContext> {
  return requireRoleAccess(getStudentAccess(), errorRedirectUrl, loginRedirectUrl);
}
