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
