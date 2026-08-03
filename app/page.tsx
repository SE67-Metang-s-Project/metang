import {
  getCmuDisplayName,
  getCmuSession,
  isCmuAuthConfigured,
} from "@/lib/cmu-auth";

const errorMessages: Record<string, string> = {
  configuration: "ยังไม่ได้ตั้งค่า CMU Entra สำหรับแอปนี้",
  access_denied: "การเข้าสู่ระบบถูกยกเลิก",
  invalid_callback: "ข้อมูลตอบกลับจาก CMU ไม่ครบถ้วน กรุณาลองใหม่",
  invalid_state: "คำขอเข้าสู่ระบบหมดอายุหรือไม่ถูกต้อง กรุณาลองใหม่",
  token_exchange_failed: "ไม่สามารถยืนยันการเข้าสู่ระบบกับ CMU ได้",
  profile_failed: "เข้าสู่ระบบสำเร็จ แต่ไม่สามารถอ่านข้อมูลบัญชี CMU ได้",
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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-16">
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
          <pre className="mt-3 overflow-x-auto bg-zinc-950 p-4 text-xs text-zinc-100">
            {JSON.stringify(session.profile, null, 2)}
          </pre>

          <form action="/api/auth/logout" className="mt-8" method="post">
            <button
              className={
                "border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 " +
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
            <a
              className={
                "mt-8 inline-block bg-[#6f1d77] px-5 py-3 font-medium text-white " +
                "hover:bg-[#5c1863]"
              }
              href="/api/auth/login"
            >
              เข้าสู่ระบบด้วย CMU Account
            </a>
          ) : (
            <p
              className={
                "mt-8 border border-amber-200 bg-amber-50 px-4 py-3 text-sm " +
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
