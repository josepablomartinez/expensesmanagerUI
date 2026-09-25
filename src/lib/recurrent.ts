import type { RecurrentDue } from "@/lib/api";

// The API serializes DATE columns as midnight-UTC timestamps
// ("2026-09-01T00:00:00Z"). Taking the date part as-is keeps it on the
// right day; going through new Date() would shift it to the previous day
// in any timezone behind UTC.
export function apiDate(value: string) {
  return value.slice(0, 10);
}

// "2026-09-01..." -> "2026-09", the period format the API's
// /periods/{period} routes and recurrent_period take.
export function periodKey(period: string) {
  return period.slice(0, 7);
}

// Local-midnight Date for a YYYY-MM-DD string (for month/day display).
export function localDate(value: string) {
  const [y, m, d] = apiDate(value).split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Everything the Add Expense form needs to act as "mark as paid" for a
// pending recurrence, carried in the URL so the review card can just link
// there (and a reload keeps the form prefilled).
export interface PayPrefill {
  recurrentExpenseId: number;
  period: string; // YYYY-MM
  name: string;
  categoryId: number;
  amount: number | null;
  currency: "CRC" | "USD";
}

export function payUrl(due: RecurrentDue) {
  const q = new URLSearchParams({
    recurrent: String(due.recurrent_expense_id),
    period: periodKey(due.period),
    name: due.name,
    category: String(due.category_id),
  });
  if (due.amount != null) q.set("amount", String(due.amount));
  if (due.currency) q.set("currency", due.currency);
  return `/add?${q}`;
}

// Inverse of payUrl. Null unless the recurrence, period and category are
// all present and well-formed -- a half-filled link falls back to the plain
// Add Expense form rather than sending a request the API would reject.
export function readPayPrefill(params: URLSearchParams): PayPrefill | null {
  const recurrentExpenseId = Number(params.get("recurrent"));
  const categoryId = Number(params.get("category"));
  const period = params.get("period") ?? "";
  if (!Number.isInteger(recurrentExpenseId) || recurrentExpenseId <= 0) return null;
  if (!Number.isInteger(categoryId) || categoryId <= 0) return null;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return null;

  const rawAmount = params.get("amount");
  const amount = rawAmount != null && rawAmount !== "" && Number(rawAmount) > 0 ? Number(rawAmount) : null;
  return {
    recurrentExpenseId,
    period,
    name: params.get("name") ?? "",
    categoryId,
    amount,
    currency: params.get("currency") === "USD" ? "USD" : "CRC",
  };
}
