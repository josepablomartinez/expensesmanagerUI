import type { DisplayCurrency } from "@/lib/currency";

const crcFormatter = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Only CRC and USD show up in practice today.
export function formatMoney(amount: number | null | undefined, currency?: string | null) {
  const value = amount ?? 0;
  return currency === "USD" ? usdFormatter.format(value) : crcFormatter.format(value);
}

interface AmountLike {
  amount: number | null;
  currency?: string | null;
  colones_amount?: number | null;
  dollars_amount?: number | null;
}

// Prefers each row's stored equivalent for the given display currency
// (colones_amount/dollars_amount, set at insert/split/update time) --
// falls back to the raw amount/currency when the expense predates that
// column or has no equivalent for the other currency (e.g. old USD rows
// before dollars_amount existed).
export function formatExpenseAmount(expense: AmountLike, displayCurrency: DisplayCurrency = "CRC") {
  if (displayCurrency === "USD") {
    if (expense.dollars_amount != null) return formatMoney(expense.dollars_amount, "USD");
    return formatMoney(expense.amount, expense.currency);
  }
  if (expense.colones_amount != null) {
    return formatMoney(expense.colones_amount, "CRC");
  }
  return formatMoney(expense.amount, expense.currency);
}

// Same preference, as a plain number, for summing totals across a mix of
// expenses that may be in different original currencies.
export function expenseValue(expense: AmountLike, displayCurrency: DisplayCurrency = "CRC") {
  if (displayCurrency === "USD") {
    return expense.dollars_amount ?? (expense.currency === "USD" ? expense.amount : null) ?? 0;
  }
  return expense.colones_amount ?? (expense.currency === "CRC" ? expense.amount : null) ?? 0;
}

// n8n's foreign-currency node writes a full explanation into `motive` (rate,
// source, date...) for its own audit trail, but the review queue only needs
// enough to say *what* needs a second look -- the amount and currency code.
// Cuts "Foreign currency: 38556 ARS converted at 0.00066363247 USD per ARS
// (currency-api, rate date 2026-09-16)." down to "Foreign currency: 38556
// ARS"; any other motive (e.g. an unresolved currency, or a future reason
// unrelated to currency) is left as-is. Callers should keep the full text
// available too, e.g. via a title/tooltip.
const FOREIGN_CURRENCY_PREFIX = /^(Foreign currency: [\d.,]+ [A-Z]{3})\b/;

export function summarizeMotive(motive: string): string {
  return motive.match(FOREIGN_CURRENCY_PREFIX)?.[1] ?? motive;
}
