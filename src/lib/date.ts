// Date.toISOString() converts to UTC first, so slicing it for a "YYYY-MM-DD"
// date rolls over to tomorrow in the evening in any timezone behind UTC
// (e.g. Costa Rica, UTC-6, from 6pm local onward). Use local getters instead.
export function localISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// monthsAgo=1 -> last month, monthsAgo=2 -> the month before that, etc.
export function monthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  return { from: localISODate(start), to: localISODate(end) };
}

// Same as monthRange, but for an explicit (year, month) pair (month is
// 1-indexed) instead of one relative to today -- for report periods the
// user has navigated to, which aren't necessarily near the current month.
export function monthRangeFor(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { from: localISODate(start), to: localISODate(end) };
}
