import * as React from "react";
import { api, type BudgetBurndownRow } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PeriodSelect } from "@/components/reports/PeriodSelect";
import { EChart, chartColors } from "@/components/charts/EChart";
import { groupByMainCategory, type MainCategoryGroup } from "@/lib/categoryGrouping";
import { useT } from "@/lib/language";
import type { EChartsOption } from "echarts";

function dayOfMonth(dateStr: string) {
  const day = dateStr.split("-")[2];
  return day ? String(parseInt(day, 10)) : dateStr;
}

export default function Burndown() {
  const { currency } = useCurrency();
  const t = useT();
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);

  const [categories, setCategories] = React.useState<MainCategoryGroup[]>([]);
  const [categoryId, setCategoryId] = React.useState<number | null>(null);

  const [rows, setRows] = React.useState<BudgetBurndownRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // fn_budget_burndown groups at the main-category level; budget-vs-actual
  // already exposes main_category_id + names, so reuse it here instead of
  // adding a dedicated main-category endpoint.
  React.useEffect(() => {
    api.reports
      .budgetVsActual(year, month)
      .then((data) => setCategories(groupByMainCategory(data)))
      .catch(() => setCategories([]));
  }, [year, month]);

  React.useEffect(() => {
    setCategoryId((current) => {
      const stillValid = categories.some((g) => g.mainCategoryId === current);
      return stillValid ? current : (categories[0]?.mainCategoryId ?? null);
    });
  }, [categories]);

  React.useEffect(() => {
    if (categoryId == null) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api.reports
      .burndown(year, month, categoryId)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : t.burndown.failedToLoad))
      .finally(() => setLoading(false));
  }, [year, month, categoryId]);

  const chartOption = React.useMemo(() => {
    if (rows.length === 0) return null;
    const primary = chartColors.primary();
    const destructive = chartColors.destructive();
    const muted = chartColors.mutedForeground();
    const border = chartColors.border();

    const cumulativeOf = (r: (typeof rows)[number]) => (currency === "USD" ? r.cumulative_usd : r.cumulative_crc);
    const expectedOf = (r: (typeof rows)[number]) => (currency === "USD" ? r.expected_usd : r.expected_crc);

    const days = rows.map((r) => dayOfMonth(r.date));
    const expected = rows.map(expectedOf);
    const crossIndex = rows.findIndex((r) => cumulativeOf(r) > expectedOf(r));
    const underPace = rows.map((r, i) => (crossIndex === -1 || i <= crossIndex ? cumulativeOf(r) : null));
    const overPace = rows.map((r, i) => (crossIndex !== -1 && i >= crossIndex ? cumulativeOf(r) : null));
    const budget = (currency === "USD" ? rows[0]?.budget_usd : rows[0]?.budget) ?? null;

    // Two null-padded segments (rather than one series recolored by
    // visualMap) so under/over-pace portions render in different colors.
    // Both are internally named "actual-under"/"actual-over" -- sharing the
    // display name "Actual" made ECharts' axis-trigger tooltip fade out both
    // line segments on hover (the null value at the hovered index in
    // whichever segment wasn't active confused the emphasis/blur state) --
    // so tooltip/legend use a shared displayName instead of series.name.
    const option: EChartsOption = {
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const list = (Array.isArray(params) ? params : [params]).filter((p) => p.value != null);
          const lines = list.map((p) => {
            const displayName = p.seriesName === t.burndown.expectedPace ? t.burndown.expectedPace : t.burndown.actual;
            return `${p.marker ?? ""}${displayName}: ${formatMoney(p.value as number, currency)}`;
          });
          return [list[0]?.name ?? "", ...lines].join("<br/>");
        },
      },
      legend: {
        data: [t.burndown.actual, t.burndown.expectedPace],
        top: 0,
        textStyle: { color: muted },
      },
      grid: { left: 56, right: 52, top: 40, bottom: 28 },
      xAxis: {
        type: "category",
        data: days,
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: border } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: muted, formatter: (v: number) => formatMoney(v, currency) },
        splitLine: { lineStyle: { color: border, opacity: 0.3 } },
      },
      series: [
        {
          name: t.burndown.expectedPace,
          type: "line",
          data: expected,
          showSymbol: false,
          emphasis: { disabled: true },
          blur: { lineStyle: { opacity: 1 } },
          lineStyle: { type: "dashed", color: muted, width: 1.5 },
        },
        {
          name: t.burndown.actual,
          type: "line",
          data: underPace,
          showSymbol: false,
          connectNulls: false,
          emphasis: { disabled: true },
          blur: { lineStyle: { opacity: 1 } },
          lineStyle: { color: primary, width: 2.5 },
          markLine:
            budget != null
              ? {
                  symbol: "none",
                  label: { formatter: t.burndown.budget, color: muted },
                  lineStyle: { type: "dashed", color: border },
                  data: [{ yAxis: budget }],
                }
              : undefined,
        },
        {
          name: t.burndown.actual,
          type: "line",
          data: overPace,
          showSymbol: false,
          connectNulls: false,
          emphasis: { disabled: true },
          blur: { lineStyle: { opacity: 1 } },
          lineStyle: { color: destructive, width: 2.5 },
          markPoint:
            crossIndex >= 0
              ? {
                  symbol: "circle",
                  symbolSize: 6,
                  itemStyle: { color: destructive },
                  label: { show: false },
                  data: [{ name: "crossover", coord: [crossIndex, cumulativeOf(rows[crossIndex])] }],
                }
              : undefined,
        },
      ],
    };
    return option;
  }, [rows, currency, t]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.burndown.title}</h1>
        <PeriodSelect year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.burndown.noBudgetedCategories}</p>
      ) : (
        <>
          <Select value={categoryId ?? ""} onChange={(e) => setCategoryId(Number(e.target.value))} className="w-fit">
            {categories.map((g) => (
              <option key={g.mainCategoryId} value={g.mainCategoryId}>
                {g.mainName}
              </option>
            ))}
          </Select>

          <Card>
            <CardContent className="pt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">{t.common.loading}</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : chartOption ? (
                <EChart option={chartOption} height={320} />
              ) : (
                <p className="text-sm text-muted-foreground">{t.burndown.noSpendRecorded}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
