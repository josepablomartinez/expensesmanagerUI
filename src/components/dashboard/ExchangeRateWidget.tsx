import * as React from "react";
import { Landmark } from "lucide-react";
import { api, type ExchangeRateLatest } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExchangeRateWidget({ favoriteBanks }: { favoriteBanks: string[] }) {
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
      <CardHeader>
        <CardTitle>Exchange rate</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rate data for your favorite banks yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rows.map((r) => (
              <div key={r.bank_id} className="flex flex-col gap-1 rounded-md bg-secondary/40 px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Landmark className="h-3.5 w-3.5" />
                  {r.name}
                </span>
                <span className="text-lg font-semibold">{formatMoney(r.buy_price, "CRC")}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
