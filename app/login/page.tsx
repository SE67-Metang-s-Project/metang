import React from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCmuSession, isCmuAuthConfigured } from "@/lib/cmu-auth";
import { getUserHomePath } from "@/lib/loan-auth";
import { sanitizeReturnPath } from "@/lib/return-path";
import { withBasePath } from "@/lib/base-path";
import Grainient from "@/components/ui/Grainient";

const errorMessages: Record<string, string> = {
  configuration: "ยังไม่ได้ตั้งค่า CMU Entra สำหรับแอปนี้",
  access_denied: "การเข้าสู่ระบบถูกยกเลิก",
  invalid_callback: "ข้อมูลตอบกลับจาก CMU ไม่ครบถ้วน กรุณาลองใหม่",
  invalid_state: "คำขอเข้าสู่ระบบหมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่",
  token_exchange_failed: "ไม่สามารถยืนยันการเข้าสู่ระบบกับ CMU ได้",
  profile_failed: "เข้าสู่ระบบสำเร็จ แต่ไม่สามารถอ่านข้อมูลบัญชี CMU ได้",
  not_eligible:
    "ระบบนี้อนุญาตให้นักศึกษาปริญญาตรี ภาคปกติ คณะพยาบาลศาสตร์ หรือบุคลากรคณะพยาบาลศาสตร์เท่านั้น",
  login_failed: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ กรุณาลองใหม่",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCmuSession();
  if (session) {
    const homePath = await getUserHomePath(session.profile);
    redirect(homePath);
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const errorParam = resolvedParams?.error;
  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const errorMessage = errorCode ? (errorMessages[errorCode] ?? errorCode) : undefined;
  const isConfigured = isCmuAuthConfigured();
  const nextParam = resolvedParams?.next;
  const returnPath = sanitizeReturnPath(Array.isArray(nextParam) ? nextParam[0] : nextParam);
  const loginHref = withBasePath(
    returnPath
      ? `/api/auth/login?next=${encodeURIComponent(returnPath)}`
      : "/api/auth/login",
  );

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans overflow-hidden">
      {/* Background Grainient (เทา - ขาว) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Grainient
          color1="#e2e8f0"
          color2="#A7A9AC"
          color3="#ede8e5"
          timeSpeed={0.3}
          colorBalance={-0.1}
          warpStrength={1.8}
          grainScale={1.2}
          zoom={0.8}
        />
      </div>

      {/* กล่องไว้ตรงกลางหน้า */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto flex items-center justify-center">
        <div className="flex flex-col justify-center items-center w-full p-8 sm:p-10 rounded-[32px] bg-white/85 backdrop-blur-[24px] border border-white/80 shadow-[0_16px_40px_rgba(0,0,0,0.06)] text-center">
          {/* หัวข้อยินดีต้อนรับ */}
          <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-3 sm:mb-4">
            ยินดีต้อนรับ
          </h2>

          {/* โลโก้ตรงกลาง (แทนที่คำว่า METANG) */}
          <div className="relative flex items-center justify-center w-36 sm:w-44 mb-4 sm:mb-5">
            <Image
              alt="METANG Logo"
              className="w-full h-auto object-contain transition-all duration-300 drop-shadow-md"
              height={180}
              src={withBasePath("/metang-logo-transparent.png")}
              width={180}
              priority
            />
          </div>

          {/* เส้นขีดแบ่งสีส้ม */}
          <div className="w-12 sm:w-16 h-1 bg-[#f97316] mb-4 sm:mb-5 rounded-full"></div>

          {/* คำอธิบาย */}
          <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed mb-6 sm:mb-8 w-full max-w-xs">
            ระบบทุนกู้ยืมสำหรับนักศึกษาคณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่
          </p>

          {/* ส่วนแสดง Error */}
          {errorMessage ? (
            <div className="w-full mb-5 sm:mb-6 rounded-xl border border-red-200 bg-red-50 p-3.5 sm:p-4 text-xs sm:text-sm text-red-700 text-left shadow-sm">
              {errorMessage}
            </div>
          ) : null}

          {!isConfigured ? (
            <div className="w-full mb-5 sm:mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3.5 sm:p-4 text-xs sm:text-sm text-amber-900 text-left shadow-sm">
              ผู้ดูแลระบบต้องตั้งค่า CMU Entra environment variables ก่อนเปิดใช้งาน
            </div>
          ) : null}

          {/* ปุ่ม Login สไตล์การ์ดสีขาว */}
          <a
            href={loginHref}
            className="w-full bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 flex items-center hover:border-gray-300 hover:shadow-lg transition-all duration-300 group active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] focus-visible:ring-offset-2"
          >
            {/* โลโก้ CMU สี่เหลี่ยมสีเข้ม */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#202e3f] rounded-xl flex items-center justify-center mr-3 sm:mr-4 shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm">
              <span className="text-white font-bold text-xs sm:text-sm tracking-wider">CMU</span>
            </div>

            {/* ข้อความในปุ่ม */}
            <div className="flex-1 text-left min-w-0">
              <p className="font-bold text-[#1e293b] text-sm sm:text-[15px] truncate sm:whitespace-normal group-hover:text-orange-600 transition-colors">
                เข้าสู่ระบบด้วย CMU Account
              </p>
            </div>

            {/* ลูกศรชี้ขวา */}
            <div className="pl-2 pr-1 sm:pr-2 shrink-0">
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
