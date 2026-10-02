import * as React from "react";
import { api, type ExchangeRateLatest } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { BankBadge } from "@/lib/brandIcons";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";

export function ExchangeRateWidget({ favoriteBanks }: { favoriteBanks: string[] }) {
  const t = useT();
  const [rates, setRates] = React.useState<ExchangeRateLatest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (favoriteBanks.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.exchangeRates
      .list()
      .then(setRates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favoriteBanks]);

  if (favoriteBanks.length === 0) return null;

  const rows = favoriteBanks
    .map((code) => rates.find((rate) => rate.code === code))
    .filter((rate): rate is ExchangeRateLatest => rate !== undefined)
    .slice(0, 3);

  const columnClass = rows.length === 3
    ? "md:grid-cols-3"
    : rows.length === 2
      ? "md:grid-cols-2"
      : "md:grid-cols-1";

  return (
    <div className="relative z-10 border-t border-brand-hero-foreground/20 bg-black/5 md:grid md:grid-cols-[auto_1fr] md:items-stretch">
      <p className="px-5 pb-1 pt-3 text-xs font-semibold text-brand-hero-foreground/75 sm:px-7 md:flex md:items-center md:py-3 md:pr-5">
        {t.dashboard.exchangeRate.title}
      </p>
      {loading ? (
        <p className="px-5 pb-3 text-sm text-brand-hero-foreground/75 sm:px-7 md:flex md:items-center md:py-3 md:pl-0">
          {t.common.loading}
        </p>
      ) : rows.length === 0 ? (
        <p className="px-5 pb-3 text-sm text-brand-hero-foreground/75 sm:px-7 md:flex md:items-center md:py-3 md:pl-0">
          {t.dashboard.exchangeRate.noRateData}
        </p>
      ) : (
        <div
          className={cn(
            "grid divide-y divide-brand-hero-foreground/15 md:divide-x md:divide-y-0",
            columnClass,
            rows.length === 1 && "md:w-fit md:min-w-64",
          )}
        >
          {rows.map((rate) => (
            <div
              key={rate.bank_id}
              role="group"
              className="flex min-w-0 items-center gap-2.5 px-5 py-2.5 sm:px-7 md:px-5 md:py-3"
              aria-label={`${t.dashboard.exchangeRate.title}: ${rate.name}, ${formatMoney(rate.buy_price, "CRC")}`}
            >
              <BankBadge codeOrName={rate.code} />
              <span className="min-w-0 truncate text-sm font-medium">{rate.name}</span>
              <span className="ml-2 shrink-0 text-sm font-semibold tabular-nums">
                {formatMoney(rate.buy_price, "CRC")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
