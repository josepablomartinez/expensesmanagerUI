import * as React from "react";
import type { EChartsOption } from "echarts";
import { api, type IncomeVsExpensesRow } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import { useTheme } from "@/lib/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EChart, chartColors, lineMarkers } from "@/components/charts/EChart";

const RANGES = [6, 12, 24];
// Largest income sources get their own palette color; the rest fold into
// "Other income" (muted) rather than inventing hues past the chart palette.
const MAX_SOURCES = 3;
// Bars stay quiet so the expenses line is what the eye lands on.
const BAR_OPACITY = 0.8;

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// The n months ending with the current one, oldest first, as YYYY-MM keys.
function lastMonths(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => monthKey(new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1)));
}

interface Source {
  name: string;
  color: string;
  byMonth: Map<string, number>;
}

// Income per month stacked by source (income category), with the month's
// expenses as a bold line on top, in the display currency.
export function IncomeVsExpensesChart({ includeProjects = false }: { includeProjects?: boolean }) {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { currency } = useCurrency();
  const [months, setMonths] = React.useState(12);
  const [rows, setRows] = React.useState<IncomeVsExpensesRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const ive = t.charts.incomeVsExpenses;
  const locale = language === "es" ? "es-CR" : "en-US";

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    api.reports
      .incomeVsExpenses(`${lastMonths(months)[0]}-01`, includeProjects)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : t.charts.failedToLoad))
      .finally(() => setLoading(false));
  }, [months, includeProjects, t.charts.failedToLoad]);

  const keys = React.useMemo(() => lastMonths(months), [months]);
  const pick = React.useCallback((r: IncomeVsExpensesRow) => (currency === "USD" ? r.total_usd : r.total_crc), [currency]);

  const { sources, expenses } = React.useMemo(() => {
    const expenses = new Map<string, number>();
    const bySource = new Map<number, Source>();
    for (const r of rows) {
      const key = r.month.slice(0, 7);
      if (r.kind === "expense") {
        expenses.set(key, (expenses.get(key) ?? 0) + pick(r));
        continue;
      }
      const id = r.income_category_id ?? 0;
      const src = bySource.get(id) ?? { name: r.category_name ?? "", color: "", byMonth: new Map() };
      src.byMonth.set(key, (src.byMonth.get(key) ?? 0) + pick(r));
      bySource.set(id, src);
    }
    const total = (s: Source) => Array.from(s.byMonth.values()).reduce((a, b) => a + b, 0);
    const sorted = Array.from(bySource.values()).sort((a, b) => total(b) - total(a));
    // Dark green, gold, soft green: adjacent stack segments stay distinct
    // even at bar opacity (the two greens are kept apart by the gold).
    const all = chartColors.series();
    const palette = [all[0], all[2], all[1]];
    const top = sorted.slice(0, MAX_SOURCES).map((s, i) => ({ ...s, color: palette[i] }));
    const rest = sorted.slice(MAX_SOURCES);
    if (rest.length > 0) {
      const byMonth = new Map<string, number>();
      for (const s of rest) for (const [k, v] of s.byMonth) byMonth.set(k, (byMonth.get(k) ?? 0) + v);
      top.push({ name: ive.other, color: chartColors.mutedForeground(), byMonth });
    }
    return { sources: top, expenses };
    // theme is a dependency because the colors are read from CSS variables.
  }, [rows, pick, ive.other, theme]);

  const hasData = sources.length > 0 || expenses.size > 0;
  const currentKey = monthKey(new Date());

  const option = React.useMemo<EChartsOption | null>(() => {
    if (!hasData) return null;
    const muted = chartColors.mutedForeground();
    const border = chartColors.border();
    const expenseColor = chartColors.destructive();
    const money = (v: number) => formatMoney(v, currency);
    const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
    const monthLabel = (key: string, long = false) => {
      const [y, m] = key.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString(locale, long ? { month: "long", year: "numeric" } : { month: "short" });
    };
    const incomeIn = (key: string) => sources.reduce((sum, s) => sum + (s.byMonth.get(key) ?? 0), 0);

    return {
      legend: { top: 0, icon: "roundRect", itemWidth: 10, itemHeight: 10, textStyle: { color: muted } },
      grid: { top: 36, left: 8, right: 8, bottom: 4, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "line", lineStyle: { color: border } },
        formatter: (params) => {
          const list = (Array.isArray(params) ? params : [params]) as { dataIndex: number }[];
          const key = keys[list[0]?.dataIndex ?? 0];
          const income = incomeIn(key);
          const spent = expenses.get(key) ?? 0;
          const line = (marker: string, label: string, value: number) =>
            `<div style="display:flex;justify-content:space-between;gap:16px"><span>${marker}${label}</span><b>${money(value)}</b></div>`;
          const dot = (color: string) =>
            `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:${color}"></span>`;
          const parts = [`<b>${monthLabel(key, true)}</b>${key === currentKey ? ` <i>(${ive.partial})</i>` : ""}`];
          for (const s of sources) {
            const v = s.byMonth.get(key) ?? 0;
            if (v > 0) parts.push(line(dot(s.color), s.name, v));
          }
          parts.push(line("", ive.totalIncome, income));
          parts.push(line(dot(expenseColor), ive.expenses, spent));
          parts.push(line("", ive.net, income - spent));
          return parts.join("");
        },
      },
      xAxis: {
        type: "category",
        data: keys.map((k) => monthLabel(k)),
        axisLine: { lineStyle: { color: border } },
        axisTick: { show: false },
        axisLabel: { color: muted },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: muted, formatter: (v: number) => compact.format(v) },
        splitLine: { lineStyle: { color: border } },
      },
      series: [
        ...sources.map((s) => ({
          name: s.name,
          type: "bar" as const,
          stack: "income",
          barMaxWidth: 36,
          itemStyle: { color: s.color, opacity: BAR_OPACITY },
          emphasis: { disabled: true },
          data: keys.map((k) => s.byMonth.get(k) ?? 0),
        })),
        {
          name: ive.expenses,
          type: "line" as const,
          z: 10,
          emphasis: { disabled: true },
          lineStyle: { color: expenseColor, width: 3 },
          ...lineMarkers(expenseColor),
          symbolSize: 9,
          data: keys.map((k) => expenses.get(k) ?? 0),
        },
      ],
    };
  }, [hasData, sources, expenses, keys, currency, locale, currentKey, ive, theme]);

  // Oldest month first, like the chart; months with nothing at all are left out of the table.
  const table = React.useMemo(() => {
    const lines = keys.map((key) => {
      const bySource = sources.map((s) => s.byMonth.get(key) ?? 0);
      const income = bySource.reduce((a, b) => a + b, 0);
      const spent = expenses.get(key) ?? 0;
      return { key, bySource, income, spent, net: income - spent };
    }).filter((l) => l.income > 0 || l.spent > 0);
    const totals = {
      bySource: sources.map((_, i) => lines.reduce((sum, l) => sum + l.bySource[i], 0)),
      income: lines.reduce((sum, l) => sum + l.income, 0),
      spent: lines.reduce((sum, l) => sum + l.spent, 0),
    };
    return { lines, totals, net: totals.income - totals.spent };
  }, [keys, sources, expenses]);

  const money = (v: number) => formatMoney(v, currency);
  const netClass = (v: number) => (v < 0 ? "text-destructive" : "text-primary");
  const monthName = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: "short", year: "numeric" });
  };

  return (
    <Card>
      <CardHeader className="gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base text-foreground">{ive.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{ive.description}</p>
        </div>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {ive.range}
          <Select className="w-full sm:w-44" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {RANGES.map((n) => (
              <option key={n} value={n}>{ive.months(n)}</option>
            ))}
          </Select>
        </label>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : option ? (
          <>
            <EChart option={option} height={300} />
            {sources.length === 0 && <p className="text-xs text-muted-foreground">{ive.noIncome}</p>}

            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { label: ive.totalIncome, value: money(table.totals.income), className: "" },
                { label: ive.expenses, value: money(table.totals.spent), className: "" },
                { label: ive.balance, value: money(table.net), className: netClass(table.net) },
              ].map((tile) => (
                <div key={tile.label} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground">{tile.label}</p>
                  <p className={cn("text-lg font-semibold tabular-nums", tile.className)}>{tile.value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="sticky left-0 bg-card py-2 pr-4 text-left font-medium" />
                    {table.lines.map((l) => (
                      <th key={l.key} className="px-2 py-2 text-right font-medium capitalize">{monthName(l.key)}</th>
                    ))}
                    <th className="px-2 py-2 text-right font-semibold text-foreground">{ive.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s, i) => (
                    <tr key={s.name} className="border-b border-border/60 text-muted-foreground">
                      <th className="sticky left-0 bg-card py-2 pr-4 text-left font-normal">{s.name}</th>
                      {table.lines.map((l) => (
                        <td key={l.key} className="px-2 py-2 text-right tabular-nums">{l.bySource[i] > 0 ? money(l.bySource[i]) : "–"}</td>
                      ))}
                      <td className="px-2 py-2 text-right tabular-nums">{money(table.totals.bySource[i])}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-border/60 font-medium">
                    <th className="sticky left-0 bg-card py-2 pr-4 text-left font-medium">{ive.totalIncome}</th>
                    {table.lines.map((l) => (
                      <td key={l.key} className="px-2 py-2 text-right tabular-nums">{money(l.income)}</td>
                    ))}
                    <td className="px-2 py-2 text-right tabular-nums">{money(table.totals.income)}</td>
                  </tr>
                  <tr className="border-b border-border/60 font-medium">
                    <th className="sticky left-0 bg-card py-2 pr-4 text-left font-medium">{ive.expenses}</th>
                    {table.lines.map((l) => (
                      <td key={l.key} className="px-2 py-2 text-right tabular-nums">{money(l.spent)}</td>
                    ))}
                    <td className="px-2 py-2 text-right tabular-nums">{money(table.totals.spent)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <th className="sticky left-0 bg-card py-2 pr-4 text-left font-semibold">{ive.balance}</th>
                    {table.lines.map((l) => (
                      <td key={l.key} className={cn("px-2 py-2 text-right tabular-nums", netClass(l.net))}>{money(l.net)}</td>
                    ))}
                    <td className={cn("px-2 py-2 text-right tabular-nums", netClass(table.net))}>{money(table.net)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{ive.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}
