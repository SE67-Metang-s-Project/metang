import {
  getCmuDisplayName,
  getCmuSession,
  isCmuAuthConfigured,
} from "@/lib/cmu-auth";
import { CalendarCheck, Clock, CheckSquare, X } from "lucide-react"; // นำเข้า Icon จาก lucide-react

const errorMessages: Record<string, string> = {
  configuration: "ยังไม่ได้ตั้งค่า CMU Entra สำหรับแอปนี้",
  access_denied: "การเข้าสู่ระบบถูกยกเลิก",
  invalid_callback: "ข้อมูลตอบกลับจาก CMU ไม่ครบถ้วน กรุณาลองใหม่",
  invalid_state: "คำขอเข้าสู่ระบบหมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่",
  token_exchange_failed: "ไม่สามารถยืนยันการเข้าสู่ระบบกับ CMU ได้",
  profile_failed: "เข้าสู่ระบบสำเร็จ แต่ไม่สามารถอ่านข้อมูลบัญชี CMU ได้",
  not_eligible: "ระบบนี้อนุญาติให้ นักศึกษา ปริญาตรี ภาคปกติ คณะพยาบาล หรือ บุคลากร คณะพยาบาลเท่านั้น",
  login_failed: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ กรุณาลองใหม่",
};

const profileLabels: Record<string, string> = {
  cmuitaccount_name: "CMU IT Account",
  cmuitaccount: "อีเมล CMU",
  student_id: "รหัสนักศึกษา",
  firstname_TH: "ชื่อ",
  lastname_TH: "นามสกุล",
  firstname_EN: "First name",
  lastname_EN: "Last name",
  organization_name_TH: "ส่วนงาน",
  organization_name_EN: "Organization",
  itaccounttype_TH: "ประเภทบัญชี",
  itaccounttype_EN: "Account type",
};

type HomeProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

function getProfileLabel(key: string) {
  return profileLabels[key] ?? key.replaceAll("_", " ");
}

function formatProfileValue(value: unknown) {
  return typeof value === "object" ? JSON.stringify(value) : String(value ?? "-");
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getCmuSession();
  const { error } = await searchParams;
  const errorCode = Array.isArray(error) ? error[0] : error;
  const errorMessage = errorCode ? errorMessages[errorCode] : undefined;

  return (
    // ขยายขนาดคอนเทนเนอร์เป็น max-w-5xl เพื่อให้เรียงกล่อง 4 ใบได้สวยงาม
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-16">
      <header className="border-b border-zinc-200 pb-6">
        <p className="mb-2 text-sm text-zinc-500">ระบบกู้ยืมเงินฉุกเฉิน</p>
        <h1 className="text-3xl font-semibold text-zinc-950">Me Tang</h1>
      </header>

      {errorMessage ? (
        <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      {session ? (
        <section className="py-8">
          <p className="text-sm text-green-700">เข้าสู่ระบบแล้ว</p>
          <h2 className="mt-2 text-2xl font-medium text-zinc-950">
            {getCmuDisplayName(session.profile)}
          </h2>

          {/* สถิติคำร้อง 4 กล่อง (เพิ่มเข้ามาใหม่) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-10">
            
            {/* 1. ทั้งหมด (สีฟ้า) */}
            <div className="bg-[#dbeafe] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center h-[110px] shadow-sm">
              <div className="relative z-10">
                <p className="text-[13px] font-extrabold text-[#1e40af] mb-1 leading-tight">ทั้งหมด</p>
                <h3 className="text-[34px] font-extrabold text-[#1e40af] leading-none">3</h3>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/70 rounded-[14px] flex items-center justify-center z-10 shadow-sm">
                <CalendarCheck className="w-7 h-7 text-[#1e40af]" strokeWidth={2.5} />
              </div>
              <CalendarCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-[#bfdbfe] opacity-80" strokeWidth={2.5} />
            </div>

            {/* 2. รอพิจารณา (สีเหลือง) */}
            <div className="bg-[#fef3c7] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center h-[110px] shadow-sm">
              <div className="relative z-10">
                <p className="text-[13px] font-extrabold text-[#b45309] mb-1 leading-tight">รอพิจารณา</p>
                <h3 className="text-[34px] font-extrabold text-[#b45309] leading-none">0</h3>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/70 rounded-[14px] flex items-center justify-center z-10 shadow-sm">
                <Clock className="w-7 h-7 text-[#b45309]" strokeWidth={2.5} />
              </div>
              <Clock className="absolute -right-4 -bottom-4 w-24 h-24 text-[#fde68a] opacity-80" strokeWidth={2.5} />
            </div>

            {/* 3. อนุมัติ (สีเขียว) */}
            <div className="bg-[#dcfce7] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center h-[110px] shadow-sm">
              <div className="relative z-10">
                <p className="text-[13px] font-extrabold text-[#166534] mb-1 leading-tight">อนุมัติ</p>
                <h3 className="text-[34px] font-extrabold text-[#166534] leading-none">3</h3>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/70 rounded-[14px] flex items-center justify-center z-10 shadow-sm">
                <CheckSquare className="w-7 h-7 text-[#166534]" strokeWidth={2.5} />
              </div>
              <CheckSquare className="absolute -right-4 -bottom-4 w-24 h-24 text-[#bbf7d0] opacity-80" strokeWidth={2.5} />
            </div>

            {/* 4. ปฏิเสธ (สีแดง) */}
            <div className="bg-[#fee2e2] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center h-[110px] shadow-sm">
              <div className="relative z-10">
                <p className="text-[13px] font-extrabold text-[#b91c1c] mb-1 leading-tight">ปฏิเสธ</p>
                <h3 className="text-[34px] font-extrabold text-[#b91c1c] leading-none">0</h3>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/70 rounded-[14px] flex items-center justify-center z-10 shadow-sm">
                <X className="w-7 h-7 text-[#b91c1c]" strokeWidth={3} />
              </div>
              <X className="absolute -right-4 -bottom-4 w-24 h-24 text-[#fecaca] opacity-80" strokeWidth={3} />
            </div>

          </div>

          {/* Profile Details */}
          <dl className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
            {Object.entries(session.profile).map(([key, value]) => (
              <div className="grid gap-1 py-3 sm:grid-cols-2" key={key}>
                <dt className="text-sm text-zinc-500">{getProfileLabel(key)}</dt>
                <dd className="break-words text-sm text-zinc-900">
                  {formatProfileValue(value)}
                </dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-8 text-lg font-medium text-zinc-950">CMU BasicInfo API response</h3>
          <pre className="mt-3 overflow-x-auto bg-zinc-950 p-4 text-xs text-zinc-100 rounded-lg">
            {JSON.stringify(session.profile, null, 2)}
          </pre>

          <form action="/api/auth/logout" className="mt-8" method="post">
            <button
              className={
                "border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 rounded-lg " +
                "hover:bg-zinc-50"
              }
              type="submit"
            >
              ออกจากระบบ
            </button>
          </form>
        </section>
      ) : (
        <section className="py-12">
          <h2 className="text-xl font-medium text-zinc-950">เข้าสู่ระบบ</h2>
          <p className="mt-3 max-w-lg leading-7 text-zinc-600">
            ใช้บัญชี CMU เพื่อยืนยันตัวตนและอ่านข้อมูลพื้นฐานที่จำเป็นสำหรับระบบ
          </p>

          {isCmuAuthConfigured() ? (
            <div className="mt-8 flex flex-col items-start gap-3">
              <a
                className={
                  "inline-block bg-[#6f1d77] px-5 py-3 font-medium text-white rounded-lg " +
                  "hover:bg-[#5c1863] transition-colors"
                }
                href="/api/auth/login"
              >
                เข้าสู่ระบบด้วย CMU Account
              </a>
              <a
                className={
                  "inline-block border border-[#6f1d77] px-5 py-3 font-medium rounded-lg " +
                  "text-[#6f1d77] hover:bg-purple-50 transition-colors"
                }
                href="/api/auth/nurse/login"
              >
                CMU SSO สำหรับคณะพยาบาลศาสตร์
              </a>
            </div>
          ) : (
            <p
              className={
                "mt-8 border border-amber-200 bg-amber-50 px-4 py-3 text-sm rounded-lg " +
                "text-amber-900"
              }
            >
              ผู้ดูแลระบบต้องตั้งค่า CMU Entra environment variables ก่อนเปิดใช้งาน
            </p>
          )}
        </section>
      )}
    </main>
  );
}