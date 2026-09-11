import Link from "next/link";
import { LoanReminderDemoForm } from "@/app/email-reminder-demo/LoanReminderDemoForm";
import { getCmuSession, getProfileEmail } from "@/lib/cmu-auth";

export default async function EmailReminderDemoPage() {
  const session = await getCmuSession();
  const email = session ? getProfileEmail(session.profile) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">Email notification</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950">
          Loan due-date reminder (Email)
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          ส่งอีเมลแจ้งเตือนผ่าน Server Action โดยเก็บ API token ไว้ฝั่ง server เท่านั้น
        </p>

        {!session ? (
          <a
            className="mt-6 block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700"
            href="/api/auth/login"
          >
            เข้าสู่ระบบด้วย CMU Account
          </a>
        ) : email ? (
          <LoanReminderDemoForm email={email} />
        ) : (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            ไม่พบอีเมลในบัญชี CMU
          </p>
        )}

        <Link className="mt-6 block text-center text-sm text-zinc-500 hover:text-zinc-900" href="/">
          กลับหน้าหลัก
        </Link>
      </section>
    </main>
  );
}
