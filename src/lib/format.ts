const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export function timeAgo(ts: number, now = Date.now()): string {
  const seconds = Math.round((ts - now) / 1000);
  if (Math.abs(seconds) < 45) return "just now";
  for (const [unit, secs] of UNITS) {
    if (Math.abs(seconds) >= secs) return rtf.format(Math.round(seconds / secs), unit);
  }
  return rtf.format(Math.round(seconds / 60), "minute");
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" });
}
