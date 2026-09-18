import React from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCmuSession, isCmuAuthConfigured } from "@/lib/cmu-auth";
import { getUserHomePath } from "@/lib/loan-auth";
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

  return (
    <div className="relative min-h-screen bg-[#fcf9f4] flex items-center justify-center p-6 sm:p-10 md:p-16 font-sans overflow-hidden">
      {/* Background Grainient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Grainient
          color1="#f89f60"
          color2="#f4c5c5"
          color3="#f89f60"
          timeSpeed={0.45}
          colorBalance={-0.18}
          warpStrength={2.3}
          grainScale={1.5}
          zoom={0.7}
        />
      </div>

      {/* 2. สร้าง Container จัดกลุ่มให้ทั้งสองฝั่งอยู่ตรงกลาง และเว้นระยะห่าง (gap) */}
      <div className="relative z-10 w-full max-w-[1200px] flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20 lg:gap-32">
        {/* ด้านซ้าย: พื้นที่แสดงโลโก้ */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center w-48 sm:w-64 md:w-80 lg:w-96 xl:w-[450px]">
            <Image
              alt="METANG Logo"
              className="w-full h-auto object-contain transition-all duration-500 drop-shadow-lg"
              height={550}
              src="/metang-logo.png"
              width={550}
              priority
            />
          </div>
        </div>

        {/* ด้านขวา: ข้อมูลและปุ่ม Login */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <div className="flex flex-col justify-center items-center w-full max-w-[500px] min-h-[478px] p-[38px] rounded-[40px] bg-[rgba(255,255,255,0.15)] backdrop-blur-[30px] border-2 border-white shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] text-center">
            {/* หัวข้อยินดีต้อนรับ */}
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e293b] mb-2 sm:mb-3">
              ยินดีต้อนรับ
            </h2>

            {/* ชื่อระบบ */}
            <h1 className="text-orange-500 text-4xl sm:text-5xl font-extrabold tracking-wide mb-4 sm:mb-6 drop-shadow-sm">
              METANG
            </h1>

            {/* เส้นขีดแบ่งสีส้ม */}
            <div className="w-12 sm:w-16 h-1 bg-[#f97316] mb-5 sm:mb-7 lg:mb-8 rounded-full"></div>

            {/* คำอธิบาย */}
            <p className="text-orange-500 text-sm sm:text-base font-medium leading-relaxed mb-6 sm:mb-8 w-full max-w-xs">
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
              href="/api/auth/login"
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
    </div>
  );
}
