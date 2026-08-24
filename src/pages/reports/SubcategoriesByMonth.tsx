import * as React from "react";
import { api, type CategoryMonthMatrixRow } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EChart, chartColors } from "@/components/charts/EChart";
import { groupByMainCategory, type MainCategoryGroup } from "@/lib/categoryGrouping";
import type { EChartsOption } from "echarts";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function SubcategoriesByMonth() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());

  const [categories, setCategories] = React.useState<MainCategoryGroup[]>([]);
  const [categoryId, setCategoryId] = React.useState<number | null>(null);

  const [rows, setRows] = React.useState<CategoryMonthMatrixRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // fn_category_month_matrix groups at the subcategory level under one main
  // category; budget-vs-actual already exposes main_category_id + names, so
  // reuse it here (same trick as Burndown.tsx) instead of a dedicated
  // main-category lookup. The month passed is arbitrary -- which categories
  // exist doesn't depend on it -- January is just a fixed pick.
  React.useEffect(() => {
    api.reports
      .budgetVsActual(year, 1)
      .then((data) => setCategories(groupByMainCategory(data)))
      .catch(() => setCategories([]));
  }, [year]);

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
      .categoryMonthMatrix(year, categoryId)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [year, categoryId]);

  const chartOption = React.useMemo(() => {
    if (rows.length === 0) return null;
    const muted = chartColors.mutedForeground();
    const border = chartColors.border();

    const bySubcategory = new Map<number, { name: string; totals: number[] }>();
    for (const row of rows) {
      const existing = bySubcategory.get(row.subcategoria_id);
      if (existing) {
        existing.totals[row.month - 1] = row.total_crc;
      } else {
        const totals = new Array(12).fill(0);
        totals[row.month - 1] = row.total_crc;
        bySubcategory.set(row.subcategoria_id, { name: row.subcategoria_nombre, totals });
      }
    }

    const series = Array.from(bySubcategory.values()).map((s) => ({
      name: s.name,
      type: "line" as const,
      data: s.totals,
      showSymbol: false,
      emphasis: { disabled: true },
      blur: { lineStyle: { opacity: 1 } },
      lineStyle: { width: 2 },
    }));

    const option: EChartsOption = {
      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const list = Array.isArray(params) ? params : [params];
          const lines = list.map((p) => `${p.marker ?? ""}${p.seriesName}: ${formatMoney(p.value as number, "CRC")}`);
          return [list[0]?.name ?? "", ...lines].join("<br/>");
        },
      },
      legend: {
        type: "scroll",
        top: 0,
        textStyle: { color: muted },
      },
      grid: { left: 56, right: 16, top: 40, bottom: 28 },
      xAxis: {
        type: "category",
        data: MONTH_LABELS,
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: border } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: muted, formatter: (v: number) => formatMoney(v, "CRC") },
        splitLine: { lineStyle: { color: border, opacity: 0.3 } },
      },
      series,
    };
    return option;
  }, [rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Subcategorías x mes</h1>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-fit">
          {[year - 1, year, year + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No budgeted categories for this year.</p>
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
                <EChart option={chartOption} height={360} />
              ) : (
                <p className="text-sm text-muted-foreground">No subcategories under this category.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
