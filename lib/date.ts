export function bangkokDatePlusDays(days: number, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return new Date(Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day) + days));
}

const bangkokDateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  // Not hour12: false, which some engines render as "24" at midnight.
  hourCycle: "h23",
});

/** Asia/Bangkok wall-clock parts of an instant, whatever the runtime's own time zone. */
export function bangkokParts(date: Date) {
  const parts = bangkokDateTimeFormat.formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return {
    year: Number(value.year),
    month: Number(value.month),
    day: Number(value.day),
    hour: Number(value.hour),
    minute: Number(value.minute),
  };
}

/**
 * YYYY-MM-DD of an instant's Bangkok calendar day, so keys compare correctly as strings. A
 * `@db.Date` value (UTC midnight) is 07:00 of the same day in Bangkok, so it keeps its date.
 */
export function bangkokDateKey(date: string | Date) {
  const { year, month, day } = bangkokParts(new Date(date));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
