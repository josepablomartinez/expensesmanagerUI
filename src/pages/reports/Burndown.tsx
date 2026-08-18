import * as React from "react";
import { api, type BudgetBurndownRow } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PeriodSelect } from "@/components/reports/PeriodSelect";
import { EChart, chartColors } from "@/components/charts/EChart";
import { groupByMainCategory, type MainCategoryGroup } from "@/lib/categoryGrouping";
import type { EChartsOption } from "echarts";

function dayOfMonth(dateStr: string) {
  const day = dateStr.split("-")[2];
  return day ? String(parseInt(day, 10)) : dateStr;
}

export default function Burndown() {
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
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [year, month, categoryId]);

  const chartOption = React.useMemo(() => {
    if (rows.length === 0) return null;
    const primary = chartColors.primary();
    const destructive = chartColors.destructive();
    const muted = chartColors.mutedForeground();
    const border = chartColors.border();

    const days = rows.map((r) => dayOfMonth(r.date));
    const expected = rows.map((r) => r.expected_crc);
    const crossIndex = rows.findIndex((r) => r.cumulative_crc > r.expected_crc);
    const underPace = rows.map((r, i) => (crossIndex === -1 || i <= crossIndex ? r.cumulative_crc : null));
    const overPace = rows.map((r, i) => (crossIndex !== -1 && i >= crossIndex ? r.cumulative_crc : null));
    const budget = rows[0]?.budget ?? null;

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
            const displayName = p.seriesName === "Expected pace" ? "Expected pace" : "Actual";
            return `${p.marker ?? ""}${displayName}: ${formatMoney(p.value as number, "CRC")}`;
          });
          return [list[0]?.name ?? "", ...lines].join("<br/>");
        },
      },
      legend: {
        data: ["Actual", "Expected pace"],
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
        axisLabel: { color: muted, formatter: (v: number) => formatMoney(v, "CRC") },
        splitLine: { lineStyle: { color: border, opacity: 0.3 } },
      },
      series: [
        {
          name: "Expected pace",
          type: "line",
          data: expected,
          showSymbol: false,
          emphasis: { disabled: true },
          blur: { lineStyle: { opacity: 1 } },
          lineStyle: { type: "dashed", color: muted, width: 1.5 },
        },
        {
          name: "Actual",
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
                  label: { formatter: "Budget", color: muted },
                  lineStyle: { type: "dashed", color: border },
                  data: [{ yAxis: budget }],
                }
              : undefined,
        },
        {
          name: "Actual",
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
                  data: [{ name: "crossover", coord: [crossIndex, rows[crossIndex].cumulative_crc] }],
                }
              : undefined,
        },
      ],
    };
    return option;
  }, [rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Burn-down</h1>
        <PeriodSelect year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No budgeted categories for this period.</p>
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
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : chartOption ? (
                <EChart option={chartOption} height={320} />
              ) : (
                <p className="text-sm text-muted-foreground">No spend recorded yet for this category.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
