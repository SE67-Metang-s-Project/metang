import Link from "next/link";
import { notFound } from "next/navigation";
import { getCmuDisplayName, getCmuSession, getProfileEmail } from "@/lib/cmu-auth";
import { isDevelopmentEnvironment } from "@/lib/development-access";

export default async function CmuSsoDemoPage() {
  if (!isDevelopmentEnvironment()) {
    notFound();
  }

  const session = await getCmuSession();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">CMU SSO</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950">
          CMU SSO response (debug)
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          แสดงข้อมูล session และ profile ทั้งหมดที่ได้จาก CMU BasicInfo API หลังเข้าสู่ระบบ
        </p>

        {!session ? (
          <a
            className="mt-6 block rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700"
            href="/api/auth/login"
          >
            เข้าสู่ระบบด้วย CMU Account
          </a>
        ) : (
          <div className="mt-6 space-y-4">
            <dl className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-zinc-500">Display name</dt>
                <dd className="text-zinc-900">{getCmuDisplayName(session.profile)}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Email</dt>
                <dd className="text-zinc-900">{getProfileEmail(session.profile) ?? "-"}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Logged in at</dt>
                <dd className="text-zinc-900">
                  {new Date(session.loggedInAt).toLocaleString("th-TH")}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Expires at</dt>
                <dd className="text-zinc-900">
                  {new Date(session.expiresAt).toLocaleString("th-TH")}
                </dd>
              </div>
            </dl>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-800">Raw profile (BasicInfo)</p>
              <pre className="max-h-[600px] overflow-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-xs text-zinc-100">
                {JSON.stringify(session.profile, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <Link className="mt-6 block text-center text-sm text-zinc-500 hover:text-zinc-900" href="/demo">
          กลับหน้า Demo
        </Link>
      </section>
    </main>
  );
}
