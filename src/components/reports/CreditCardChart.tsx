import * as React from "react";
import type { EChartsOption } from "echarts";
import { api, type CreditCard, type CreditCardCycleRow } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { splitCategoryName } from "@/lib/categoryGrouping";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EChart, chartColors } from "@/components/charts/EChart";
import { useLanguage } from "@/lib/language";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

// Largest main categories get their own slice; the rest fold into "Other"
// rather than generating hues past the 5-color chart palette.
const MAX_SLICES = 5;

interface Slice {
  name: string;
  value: number;
  color: string;
}

function cardLabel(card: CreditCard) {
  return `${card.bank_name} ${card.card_type} •••• ${card.last4}`;
}

// Donut of the card's open statement cycle by main category (in the display
// currency), plus a meter of the cycle total against the card's limit (in
// the limit's own currency, so it matches the bank statement).
export function CreditCardChart() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const [cards, setCards] = React.useState<CreditCard[] | null>(null);
  const [cardId, setCardId] = React.useState<number | null>(null);
  const [rows, setRows] = React.useState<CreditCardCycleRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.creditCards
      .list()
      .then((list) => {
        const active = list.filter((c) => c.active);
        setCards(active);
        setCardId((current) => current ?? active[0]?.id ?? null);
      })
      .catch(() => setCards([]));
  }, []);

  React.useEffect(() => {
    if (cardId == null) {
      if (cards) setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api.reports
      .creditCardCycle(cardId)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : t.charts.failedToLoad))
      .finally(() => setLoading(false));
  }, [cardId, cards, t.charts.failedToLoad]);

  const card = cards?.find((c) => c.id === cardId) ?? null;
  const pick = (r: CreditCardCycleRow, cur: string) => (cur === "USD" ? r.spent_usd : r.spent_crc);

  const slices = React.useMemo<Slice[]>(() => {
    const byMain = new Map<string, number>();
    for (const r of rows) {
      const name = r.category_name ? splitCategoryName(r.category_name).mainName : t.charts.creditCard.uncategorized;
      byMain.set(name, (byMain.get(name) ?? 0) + pick(r, currency));
    }
    const sorted = Array.from(byMain, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const palette = chartColors.series();
    const top = sorted.slice(0, MAX_SLICES).map((s, i) => ({ ...s, color: palette[i] }));
    const rest = sorted.slice(MAX_SLICES).reduce((sum, s) => sum + s.value, 0);
    return rest > 0 ? [...top, { name: t.charts.creditCard.other, value: rest, color: chartColors.mutedForeground() }] : top;
    // theme is a dependency because the colors are read from CSS variables.
  }, [rows, currency, t, theme]);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const limitCurrency = card?.limit_currency === "USD" ? "USD" : "CRC";
  const totalInLimit = rows.reduce((sum, r) => sum + pick(r, limitCurrency), 0);
  const limit = card?.credit_limit ?? 0;
  const pctUsed = limit > 0 ? (totalInLimit / limit) * 100 : 0;

  const option = React.useMemo<EChartsOption | null>(() => {
    if (slices.length === 0) return null;
    const foreground = chartColors.foreground();
    const muted = chartColors.mutedForeground();
    return {
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const item = Array.isArray(p) ? p[0] : p;
          return `${item.marker ?? ""}${item.name}: ${formatMoney(item.value as number, currency)} (${item.percent}%)`;
        },
      },
      title: {
        text: formatMoney(total, currency),
        subtext: t.charts.creditCard.total,
        left: "center",
        top: "center",
        itemGap: 4,
        textStyle: { color: foreground, fontSize: 15, fontWeight: 600 },
        subtextStyle: { color: muted, fontSize: 12 },
      },
      series: [
        {
          type: "pie",
          radius: ["58%", "82%"],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          // 2px surface gap between slices keeps neighbors separable even
          // where the palette's hues sit close together.
          itemStyle: { borderColor: chartColors.card(), borderWidth: 2, borderRadius: 4 },
          emphasis: { scale: true, scaleSize: 4 },
          data: slices.map((s) => ({ name: s.name, value: s.value, itemStyle: { color: s.color } })),
        },
      ],
    };
  }, [slices, total, currency, t, theme]);

  const formatDay = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(language === "es" ? "es-CR" : "en-US", { day: "numeric", month: "short" });
  };

  return (
    <Card>
      <CardHeader className="gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base text-foreground">{t.charts.creditCard.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.charts.creditCard.description}</p>
        </div>
        {cards && cards.length > 0 && (
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground sm:flex-none">
            {t.charts.creditCard.card}
            <Select className="w-full" value={cardId ?? ""} onChange={(e) => setCardId(Number(e.target.value))}>
              {cards.map((c) => <option key={c.id} value={c.id}>{cardLabel(c)}</option>)}
            </Select>
          </label>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {cards && cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.charts.creditCard.noCards}</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            {card && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm">
                    <span className="text-lg font-semibold">{formatMoney(totalInLimit, limitCurrency)}</span>{" "}
                    <span className="text-muted-foreground">{t.charts.creditCard.ofLimit(formatMoney(limit, limitCurrency))}</span>
                  </p>
                  {rows[0] && (
                    <p className="text-xs text-muted-foreground">
                      {t.charts.creditCard.cycle(formatDay(rows[0].cycle_start), formatDay(rows[0].cycle_end))}
                    </p>
                  )}
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-secondary"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(pctUsed)}
                  aria-label={t.charts.creditCard.used(`${pctUsed.toFixed(1)}%`)}
                >
                  <div
                    className={cn("h-full rounded-full", pctUsed > 100 ? "bg-destructive" : "bg-primary")}
                    style={{ width: `${Math.min(pctUsed, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t.charts.creditCard.used(`${pctUsed.toFixed(1)}%`)}</span>
                  <span className={cn(totalInLimit > limit && "font-medium text-destructive")}>
                    {totalInLimit > limit
                      ? t.charts.creditCard.overLimit(formatMoney(totalInLimit - limit, limitCurrency))
                      : t.charts.creditCard.available(formatMoney(limit - totalInLimit, limitCurrency))}
                  </span>
                </div>
                {card.cutoff_day == null && <p className="text-xs text-muted-foreground">{t.charts.creditCard.noCutoff}</p>}
              </div>
            )}

            {option ? (
              <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <EChart option={option} height={260} />
                <ul className="flex flex-col gap-1.5 text-sm">
                  {slices.map((s) => (
                    <li key={s.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{s.name}</span>
                      <span className="tabular-nums">{formatMoney(s.value, currency)}</span>
                      <span className="w-12 text-right tabular-nums text-muted-foreground">
                        {total > 0 ? `${((s.value / total) * 100).toFixed(0)}%` : "–"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.charts.creditCard.noData}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
