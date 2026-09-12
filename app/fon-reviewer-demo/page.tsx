import Link from "next/link";
import { getCmuSession } from "@/lib/cmu-auth";
import { FonReviewerDemoForm } from "@/app/fon-reviewer-demo/FonReviewerDemoForm";

export default async function FonReviewerDemoPage() {
  const session = await getCmuSession();

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
          ส่งการแจ้งเตือนผ่าน Server Action โดยดึงข้อมูลผู้รับ (Advisor, Admin, Executive)
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
          <FonReviewerDemoForm />
        )}

        <Link className="mt-6 block text-center text-sm text-zinc-500 hover:text-zinc-900" href="/">
          กลับหน้าหลัก
        </Link>
      </section>
    </main>
  );
}
