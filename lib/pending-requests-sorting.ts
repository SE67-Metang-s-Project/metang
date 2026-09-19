import type { ActionRequest } from "@/components/shared/pending/RequestsCard";

const THAI_MONTH_INDEX: Record<string, number> = {
  "ม.ค.": 0,
  "มกราคม": 0,
  "ก.พ.": 1,
  "กุมภาพันธ์": 1,
  "มี.ค.": 2,
  "มีนาคม": 2,
  "เม.ย.": 3,
  "เมษายน": 3,
  "พ.ค.": 4,
  "พฤษภาคม": 4,
  "มิ.ย.": 5,
  "มิถุนายน": 5,
  "ก.ค.": 6,
  "กรกฎาคม": 6,
  "ส.ค.": 7,
  "สิงหาคม": 7,
  "ก.ย.": 8,
  "กันยายน": 8,
  "ต.ค.": 9,
  "ตุลาคม": 9,
  "พ.ย.": 10,
  "พฤศจิกายน": 10,
  "ธ.ค.": 11,
  "ธันวาคม": 11,
};

export function parseThaiDateTimeToMs(dateStr?: string, timeStr?: string): number {
  if (!dateStr) return 0;

  const directParsed = new Date(dateStr).getTime();
  if (!isNaN(directParsed) && !dateStr.includes("ม.ค.") && !dateStr.includes("ก.ย.")) {
    return directParsed;
  }

  let combined = dateStr.trim();
  if (timeStr) {
    combined = `${combined} ${timeStr.replace("น.", "").trim()}`;
  }

  const match = combined.match(/(\d{1,2})\s+([^\s\d]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!match) return 0;

  const day = parseInt(match[1], 10);
  const monthName = match[2];
  let year = parseInt(match[3], 10);
  const hours = match[4] ? parseInt(match[4], 10) : 0;
  const minutes = match[5] ? parseInt(match[5], 10) : 0;

  if (year > 2400) {
    year -= 543;
  }

  const month = THAI_MONTH_INDEX[monthName] ?? 0;
  return new Date(year, month, day, hours, minutes).getTime();
}

export function getRequestSubmissionTimestamp(req: ActionRequest): number {
  if (req.submittedAt) {
    const t = new Date(req.submittedAt).getTime();
    if (!isNaN(t)) return t;
  }

  const submitHistory =
    req.history?.find((h) => h.action.includes("ยื่นคำร้องขอกู้ยืม")) || req.history?.[0];
  if (submitHistory?.date) {
    const t = parseThaiDateTimeToMs(submitHistory.date);
    if (t > 0) return t;
  }

  return parseThaiDateTimeToMs(req.submitDate, req.submitTime);
}

export function sortRequestsBySubmissionDateDesc<T extends ActionRequest>(requests: T[]): T[] {
  return [...requests].sort((a, b) => {
    const timeA = getRequestSubmissionTimestamp(a);
    const timeB = getRequestSubmissionTimestamp(b);
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return b.id.localeCompare(a.id);
  });
}

export function getSubmittedTime(req: ActionRequest): string | null {
  if (req.submitTime) {
    return req.submitTime.includes("น.") ? req.submitTime : `${req.submitTime} น.`;
  }
  const submitHistory =
    req.history?.find((h) => h.action.includes("ยื่นคำร้องขอกู้ยืม")) || req.history?.[0];
  const submittedAt = submitHistory?.date;
  const time = submittedAt?.match(/\d{1,2}:\d{2}/)?.[0];

  return time ? `${time} น.` : null;
}
