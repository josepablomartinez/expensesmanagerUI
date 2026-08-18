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

// Only CRC and USD show up in practice today. Defaulting to CRC (₡) rather
// than plain digits until per-user currency settings exist.
export function formatMoney(amount: number | null | undefined, currency?: string | null) {
  const value = amount ?? 0;
  return currency === "USD" ? usdFormatter.format(value) : crcFormatter.format(value);
}

interface AmountLike {
  amount: number | null;
  currency?: string | null;
  colones_amount?: number | null;
}

// Until there's a per-user currency setting, colones_amount (the CRC
// equivalent stored at insert/split time) is the preferred display value
// whenever it's present -- falls back to the raw amount/currency otherwise.
export function formatExpenseAmount(expense: AmountLike) {
  if (expense.colones_amount != null) {
    return formatMoney(expense.colones_amount, "CRC");
  }
  return formatMoney(expense.amount, expense.currency);
}

// Same preference, as a plain number, for summing totals across a mix of
// expenses that may be in different original currencies.
export function crcValue(expense: AmountLike) {
  return expense.colones_amount ?? expense.amount ?? 0;
}
