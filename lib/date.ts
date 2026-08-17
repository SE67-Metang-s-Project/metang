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
