import Image from "next/image";
import { withBasePath } from "@/lib/base-path";

export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="กำลังโหลด"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white/15 p-6 backdrop-blur-md"
      role="status"
    >
      <Image
        alt="METANG"
        className="h-auto w-36 animate-metang-logo-pulse object-contain drop-shadow-lg sm:w-44"
        height={180}
        priority
        src={withBasePath("/metang-logo-transparent.png")}
        width={180}
      />
    </div>
  );
}
