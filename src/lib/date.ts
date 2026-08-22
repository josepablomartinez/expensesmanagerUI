// Date.toISOString() converts to UTC first, so slicing it for a "YYYY-MM-DD"
// date rolls over to tomorrow in the evening in any timezone behind UTC
// (e.g. Costa Rica, UTC-6, from 6pm local onward). Use local getters instead.
export function localISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
