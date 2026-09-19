import Link from "next/link";
import { notFound } from "next/navigation";
import { getCmuSession } from "@/lib/cmu-auth";
import { FonReviewerDemoForm } from "@/app/demo/fon-reviewer/FonReviewerDemoForm";
import { isDevelopmentEnvironment } from "@/lib/development-access";
import { requireAdminAccess } from "@/lib/loan-auth";
import { getRecipientEmailsByRole } from "@/db/queries/notification-recipients";
import type { ReviewerRole } from "@/lib/reviewer-deeplink";

const REVIEWER_ROLES: ReviewerRole[] = ["advisor", "admin", "super_admin", "executive"];

export default async function FonReviewerDemoPage() {
  if (!isDevelopmentEnvironment()) {
    notFound();
  }
  await requireAdminAccess();

  const session = await getCmuSession();

  const recipientsByRole = Object.fromEntries(
    await Promise.all(
      REVIEWER_ROLES.map(async (role) => [role, await getRecipientEmailsByRole(role)] as const),
    ),
  ) as Record<ReviewerRole, string[]>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <section
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm font-medium text-emerald-700">LINE notification</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950">
          FON reviewer notification (demo)
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          ส่งการแจ้งเตือนผ่าน Server Action โดยเลือกผู้รับ (Advisor, Admin, Super Admin, Executive)
          จากฐานข้อมูล ไม่ได้ส่งเข้าบัญชีผู้ใช้ที่กำลังเข้าสู่ระบบ
        </p>

        {!session ? (
          <a
            className="mt-6 block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700"
            href="/api/auth/login"
          >
            เข้าสู่ระบบด้วย CMU Account
          </a>
        ) : (
          <FonReviewerDemoForm recipientsByRole={recipientsByRole} />
        )}

        <Link className="mt-6 block text-center text-sm text-zinc-500 hover:text-zinc-900" href="/demo">
          กลับหน้า Demo
        </Link>
      </section>
    </main>
  );
}
