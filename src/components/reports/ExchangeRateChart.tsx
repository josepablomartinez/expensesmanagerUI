import * as React from "react";
import type { EChartsOption } from "echarts";
import { api, type ExchangeRateHistoryRow, type ExchangeRateLatest } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EChart, chartColors } from "@/components/charts/EChart";
import { useT } from "@/lib/language";
import { useTheme } from "@/lib/theme";

const RANGES = [30, 90, 180, 365];

// Buy/sell line for one bank. The bank list comes from GET /exchange-rates
// (only banks with at least one rate on file), defaulting to the user's
// first favorite bank when it's in there.
export function ExchangeRateChart({ favoriteBanks }: { favoriteBanks: string[] }) {
  const t = useT();
  const { theme } = useTheme();
  const [banks, setBanks] = React.useState<ExchangeRateLatest[] | null>(null);
  const [bankId, setBankId] = React.useState<number | null>(null);
  const [days, setDays] = React.useState(90);
  const [rows, setRows] = React.useState<ExchangeRateHistoryRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.exchangeRates
      .list()
      .then((list) => setBanks([...list].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setBanks([]));
  }, []);

  React.useEffect(() => {
    if (!banks || banks.length === 0) return;
    setBankId((current) => {
      if (current != null && banks.some((b) => b.bank_id === current)) return current;
      const favorite = banks.find((b) => favoriteBanks.includes(b.code));
      return (favorite ?? banks[0]).bank_id;
    });
  }, [banks, favoriteBanks]);

  React.useEffect(() => {
    if (bankId == null) {
      if (banks) setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api.reports
      .exchangeRateHistory(bankId, days)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : t.charts.failedToLoad))
      .finally(() => setLoading(false));
  }, [bankId, days, banks, t.charts.failedToLoad]);

  const option = React.useMemo<EChartsOption | null>(() => {
    if (rows.length === 0) return null;
    const muted = chartColors.mutedForeground();
    const border = chartColors.border();
    const [buyColor, , , sellColor] = chartColors.series();
    const line = (name: string, color: string, data: number[]) => ({
      name,
      type: "line" as const,
      data,
      showSymbol: false,
      symbolSize: 8,
      lineStyle: { width: 2, color },
      itemStyle: { color },
      emphasis: { disabled: true },
      endLabel: {
        show: true,
        color: muted,
        formatter: (p: { value: unknown }) => formatMoney(p.value as number, "CRC"),
      },
    });

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: muted } },
        formatter: (params) => {
          const list = Array.isArray(params) ? params : [params];
          const lines = list.map((p) => `${p.marker ?? ""}${p.seriesName}: ${formatMoney(p.value as number, "CRC")}`);
          return [list[0]?.name ?? "", ...lines].join("<br/>");
        },
      },
      legend: { top: 0, left: 0, textStyle: { color: muted } },
      grid: { left: 8, right: 72, top: 36, bottom: 8, containLabel: true },
      xAxis: {
        type: "category",
        data: rows.map((r) => r.date),
        boundaryGap: false,
        axisLabel: { color: muted, hideOverlap: true },
        axisLine: { lineStyle: { color: border } },
      },
      yAxis: {
        type: "value",
        scale: true,
        axisLabel: { color: muted, formatter: (v: number) => formatMoney(v, "CRC") },
        splitLine: { lineStyle: { color: border, opacity: 0.3 } },
      },
      series: [
        line(t.charts.exchangeRate.sell, sellColor, rows.map((r) => r.sell_price)),
        line(t.charts.exchangeRate.buy, buyColor, rows.map((r) => r.buy_price)),
      ],
    };
  }, [rows, t, theme]);

  return (
    <Card>
      <CardHeader className="gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base text-foreground">{t.charts.exchangeRate.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.charts.exchangeRate.description}</p>
        </div>
        {banks && banks.length > 0 && (
          <div className="flex w-full gap-2 sm:w-auto">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground sm:flex-none">
              {t.charts.exchangeRate.bank}
              <Select className="w-full" value={bankId ?? ""} onChange={(e) => setBankId(Number(e.target.value))}>
                {banks.map((b) => <option key={b.bank_id} value={b.bank_id}>{b.name}</option>)}
              </Select>
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground sm:flex-none">
              {t.charts.exchangeRate.range}
              <Select className="w-full" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {RANGES.map((n) => <option key={n} value={n}>{t.charts.exchangeRate.days(n)}</option>)}
              </Select>
            </label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {banks && banks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.charts.exchangeRate.noBanks}</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : option ? (
          <>
            <EChart option={option} height={320} />
            <p className="mt-1 text-xs text-muted-foreground">{t.charts.exchangeRate.latest(rows[rows.length - 1].date)}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t.charts.exchangeRate.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}
