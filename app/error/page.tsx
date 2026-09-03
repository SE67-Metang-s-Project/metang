import Link from "next/link";
import { ShieldAlert, LogIn, ArrowLeft } from "lucide-react";

type ErrorPageProps = {
  searchParams: Promise<{ type?: string; code?: string }>;
};

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { type, code } = await searchParams;

  const isUnauthenticated = type === "unauthenticated";
  const isForbidden = type === "forbidden";

  const title = isUnauthenticated
    ? "กรุณาเข้าสู่ระบบก่อนใช้งาน"
    : isForbidden
      ? "ไม่มีสิทธิ์เข้าถึงหน้านี้ (403 Forbidden)"
      : "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์";

  const description = isUnauthenticated
    ? "ไม่พบข้อมูลการเข้าสู่ระบบ หรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบด้วย CMU IT Account เพื่อเข้าใช้งาน"
    : isForbidden
      ? "บัญชี CMU ของคุณยังไม่มีสิทธิ์ในการเข้าถึงหน้านี้ หากคุณมีหน้าที่รับผิดชอบในส่วนนี้ กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดสิทธิ์การใช้งาน"
      : "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์การเข้าใช้งาน กรุณาลองใหม่อีกครั้ง";

  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-[family-name:var(--font-kanit)]">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center space-y-6">
        <div className="mx-auto size-16 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          <ShieldAlert size={36} strokeWidth={1.8} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
            {title}
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            {description}
          </p>
          {code && (
            <p className="text-xs text-gray-400 font-mono pt-1">
              Error code: {code}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-3">
          {isUnauthenticated ? (
            <a
              href="/api/auth/login"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#6f1d77] hover:bg-[#5a1661] text-white font-medium transition-colors"
            >
              <LogIn size={18} />
              เข้าสู่ระบบด้วย CMU Account
            </a>
          ) : (
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#6f1d77] hover:bg-[#5a1661] text-white font-medium transition-colors"
            >
              <ArrowLeft size={18} />
              กลับสู่หน้าหลัก
            </Link>
          )}

          {isUnauthenticated && (
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              กลับสู่หน้าหลัก
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
