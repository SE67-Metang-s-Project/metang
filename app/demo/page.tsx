import Link from "next/link";
import { notFound } from "next/navigation";
import { isDevelopmentEnvironment } from "@/lib/development-access";

const DEMOS = [
  { href: "/demo/cmu-sso", label: "CMU SSO response (debug)" },
  { href: "/demo/email-reminder", label: "Loan due-date reminder (Email)" },
  { href: "/demo/fon-reviewer", label: "FON reviewer notification" },
  { href: "/demo/line-notification", label: "LINE notification" },
];

export default function DemoIndexPage() {
  if (!isDevelopmentEnvironment()) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-6 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-700">Demo</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Demo pages</h1>

        <ul className="mt-6 space-y-2">
          {DEMOS.map(({ href, label }) => (
            <li key={href}>
              <Link
                className="block rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:border-emerald-600 hover:text-emerald-700"
                href={href}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <Link className="mt-6 block text-center text-sm text-zinc-500 hover:text-zinc-900" href="/">
          กลับหน้าหลัก
        </Link>
      </section>
    </main>
  );
}
