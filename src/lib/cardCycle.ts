import { localISODate } from "@/lib/date";

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

// Mirrors fn_credit_card_cycle: the statement cycle containing `date` opens on
// the cutoff day (clamped to short months) and closes the day before the next
// one. No cutoff day -> the calendar month. Returns local ISO dates.
export function cycleBounds(cutoffDay: number | null, date: Date): { start: string; end: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  if (cutoffDay == null) {
    return { start: localISODate(new Date(y, m, 1)), end: localISODate(new Date(y, m + 1, 0)) };
  }
  const startOf = (yy: number, mm: number) => new Date(yy, mm, Math.min(cutoffDay, daysInMonth(yy, mm)));
  let start = startOf(y, m);
  let sy = y;
  let sm = m;
  if (start > date) {
    sm = m - 1;
    start = startOf(sy, sm);
  }
  const next = startOf(sy, sm + 1);
  const end = new Date(next.getFullYear(), next.getMonth(), next.getDate() - 1);
  return { start: localISODate(start), end: localISODate(end) };
}

export function shiftISODate(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return localISODate(new Date(y, m - 1, d + days));
}
