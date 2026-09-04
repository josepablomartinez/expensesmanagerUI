import * as React from "react";
import { api, type ExchangeRateLatest } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { BankBadge } from "@/lib/brandIcons";
import { useT } from "@/lib/language";
import { ChevronDown, ChevronUp } from "lucide-react";

export function ExchangeRateWidget({ favoriteBanks }: { favoriteBanks: string[] }) {
  const t = useT();
  const [rates, setRates] = React.useState<ExchangeRateLatest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);

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

  const visibleRows = expanded ? rows : rows.slice(0, 1);

  return (
    <Card className="w-full md:max-w-sm">
      <CardContent className="p-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashboard.exchangeRate.noRateData}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleRows.map((r) => (
              <div key={r.bank_id} className="flex items-center gap-2 rounded-md bg-secondary/40 px-3 py-2">
                <BankBadge codeOrName={r.code} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">{r.name}</span>
                  <span className="text-lg font-semibold">{formatMoney(r.buy_price, "CRC")}</span>
                </div>
                {rows.length > 1 && r === visibleRows[0] && (
                  <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    aria-expanded={expanded}
                    aria-label={expanded ? t.dashboard.exchangeRate.showLess : t.dashboard.exchangeRate.showMore}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
