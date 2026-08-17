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
