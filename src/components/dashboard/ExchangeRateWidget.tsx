import * as React from "react";
import { api, type ExchangeRateLatest } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { BankBadge } from "@/lib/brandIcons";
import { useT } from "@/lib/language";

export function ExchangeRateWidget({ favoriteBanks }: { favoriteBanks: string[] }) {
  const t = useT();
  const [rates, setRates] = React.useState<ExchangeRateLatest[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (favoriteBanks.length === 0) {
      setLoading(false);
      return;
    }
    api.exchangeRates
      .list()
      .then(setRates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favoriteBanks]);

  if (favoriteBanks.length === 0) return null;

  const rows = rates.filter((r) => favoriteBanks.includes(r.code));

  return (
    <Card>
      <CardContent className="pt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashboard.exchangeRate.noRateData}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rows.map((r) => (
              <div key={r.bank_id} className="flex items-center gap-2 rounded-md bg-secondary/40 px-3 py-2">
                <BankBadge codeOrName={r.code} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">{r.name}</span>
                  <span className="text-lg font-semibold">{formatMoney(r.buy_price, "CRC")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
