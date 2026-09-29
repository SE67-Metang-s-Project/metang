"use client";

// EXPERIMENT server-paging (revert: EXPERIMENT-server-paging.local.md)
/** Shown above a server-paged list when its last fetch failed; the previous rows stay visible. */
export default function PagedListError({ failed }: { failed: boolean }) {
  if (!failed) return null;
  return (
    <p role="alert" className="mb-2 text-[13px] text-red-600">
      โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
    </p>
  );
}
