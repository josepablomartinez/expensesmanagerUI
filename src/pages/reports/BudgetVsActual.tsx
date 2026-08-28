import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Flame } from "lucide-react";
import { api, type BudgetVsActual as BudgetVsActualRow } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PeriodSelect } from "@/components/reports/PeriodSelect";
import { EChart, chartColors } from "@/components/charts/EChart";
import { cn } from "@/lib/utils";
import { groupByMainCategory, splitCategoryName } from "@/lib/categoryGrouping";
import { useT } from "@/lib/language";
import type { EChartsOption } from "echarts";

// pct_used comes back from fn_budget_vs_actual already scaled 0-100.
function severityBarClass(pct: number) {
  if (pct >= 100) return "bg-red-600";
  if (pct >= 90) return "bg-red-400";
  if (pct >= 75) return "bg-amber-500";
  return "bg-primary";
}

export default function BudgetVsActual() {
  const { currency } = useCurrency();
  const t = useT();
  const now = new Date();
  const [searchParams] = useSearchParams();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [rows, setRows] = React.useState<BudgetVsActualRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [visibleCount, setVisibleCount] = React.useState(5);

  const [selectedMainId, setSelectedMainId] = React.useState<number | null>(null);
  const [selectedSubId, setSelectedSubId] = React.useState<number | null>(null);
  const detailRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    setVisibleCount(5);
    api.reports
      .budgetVsActual(year, month)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : t.budgetVsActual.failedToLoad))
      .finally(() => setLoading(false));
  }, [year, month]);

  const groups = React.useMemo(() => groupByMainCategory(rows), [rows]);

  // Re-anchor the detail selection to the first group whenever the loaded
  // period no longer contains the previously selected category.
  React.useEffect(() => {
    setSelectedMainId((current) => {
      const stillValid = groups.some((g) => g.mainCategoryId === current);
      return stillValid ? current : (groups[0]?.mainCategoryId ?? null);
    });
  }, [groups]);

  React.useEffect(() => {
    const group = groups.find((g) => g.mainCategoryId === selectedMainId);
    setSelectedSubId((current) => {
      const stillValid = group?.subcategories.some((r) => r.category_id === current);
      return stillValid ? current : (group?.subcategories[0]?.category_id ?? null);
    });
  }, [groups, selectedMainId]);

  // Deep-link support: the favorite-categories widget on Home links here with
  // ?category=<id> so its bar click lands directly on that category's detail.
  React.useEffect(() => {
    const catParam = searchParams.get("category");
    if (!catParam) return;
    const catId = Number(catParam);
    const row = rows.find((r) => r.category_id === catId);
    if (row?.main_category_id != null) {
      setSelectedMainId(row.main_category_id);
      setSelectedSubId(row.category_id);
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [rows, searchParams]);

  const selectedGroup = groups.find((g) => g.mainCategoryId === selectedMainId) ?? null;
  const selectedRow = selectedGroup?.subcategories.find((r) => r.category_id === selectedSubId) ?? null;

  const highestUsed = React.useMemo(
    () =>
      rows
        .filter((r) => (r.pct_used ?? 0) > 0)
        .sort((a, b) => (b.pct_used ?? 0) - (a.pct_used ?? 0)),
    [rows],
  );
  const visibleRows = highestUsed.slice(0, visibleCount);

  function selectRow(row: BudgetVsActualRow) {
    if (row.main_category_id == null) return;
    setSelectedMainId(row.main_category_id);
    setSelectedSubId(row.category_id);
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const donutOption = React.useMemo(() => {
    const budget = currency === "USD" ? selectedRow?.budget_usd : selectedRow?.budget;
    const actual = currency === "USD" ? (selectedRow?.actual_usd ?? 0) : (selectedRow?.actual_crc ?? 0);
    if (!selectedRow || budget == null) return null;
    const pct = selectedRow.pct_used ?? 0;
    const over = pct > 100;
    const primary = chartColors.primary();
    const destructive = chartColors.destructive();
    const muted = chartColors.mutedForeground();
    const border = chartColors.border();
    const foreground = chartColors.foreground();

    const data = over
      ? [
          { name: t.budgetVsActual.budget, value: budget, itemStyle: { color: primary } },
          { name: t.budgetVsActual.overBudget, value: actual - budget, itemStyle: { color: destructive } },
        ]
      : [
          { name: t.budgetVsActual.spent, value: actual, itemStyle: { color: primary } },
          { name: t.budgetVsActual.remaining, value: budget - actual, itemStyle: { color: border } },
        ];

    const option: EChartsOption = {
      title: {
        text: `${Math.round(pct)}%`,
        subtext: t.budgetVsActual.used,
        left: "center",
        top: "40%",
        textStyle: { fontSize: 22, fontWeight: 500, color: foreground },
        subtextStyle: { fontSize: 12, color: muted },
      },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const point = p as { name: string; value: number };
          return `${point.name}: ${formatMoney(point.value, currency)}`;
        },
      },
      series: [
        {
          type: "pie",
          radius: ["62%", "82%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          data,
        },
      ],
    };
    return option;
  }, [selectedRow, currency, t]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.budgetVsActual.title}</h1>
        <PeriodSelect year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_320px] md:items-start">
          <div className="flex flex-col gap-4">
            <p className="text-xs font-medium text-muted-foreground">{t.budgetVsActual.highestUsed}</p>
            <div className="flex flex-col gap-2">
              {visibleRows.map((row) => {
                const pct = row.pct_used ?? 0;
                const over = pct >= 100;
                const actual = currency === "USD" ? row.actual_usd : row.actual_crc;
                const budget = currency === "USD" ? row.budget_usd : row.budget;
                return (
                  <Card
                    key={row.category_id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectRow(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") selectRow(row);
                    }}
                    className="cursor-pointer transition-colors hover:bg-secondary/40"
                  >
                    <CardContent className="flex flex-col gap-2 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{row.category_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatMoney(actual, currency)} / {budget != null ? formatMoney(budget, currency) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative h-2 w-full rounded-full bg-secondary">
                          <div
                            className={cn("h-full rounded-full", severityBarClass(pct))}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        {over && <Flame className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {highestUsed.length > visibleCount && (
              <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + 5)}>
                {t.budgetVsActual.seeMore}
              </Button>
            )}
          </div>

          <div ref={detailRef} className="md:sticky md:top-6">
            <Card>
              <CardContent className="flex flex-col gap-3 pt-4">
                <p className="text-xs font-medium text-muted-foreground">{t.budgetVsActual.detail}</p>

                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.budgetVsActual.noBudgetedCategories}</p>
                ) : (
                  <>
                    <Select
                      value={selectedMainId ?? ""}
                      onChange={(e) => setSelectedMainId(Number(e.target.value))}
                    >
                      {groups.map((g) => (
                        <option key={g.mainCategoryId} value={g.mainCategoryId}>
                          {g.mainName}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={selectedSubId ?? ""}
                      onChange={(e) => setSelectedSubId(Number(e.target.value))}
                    >
                      {selectedGroup?.subcategories.map((r) => (
                        <option key={r.category_id} value={r.category_id}>
                          {splitCategoryName(r.category_name).subName}
                        </option>
                      ))}
                    </Select>

                    {donutOption && selectedRow ? (
                      <>
                        <EChart option={donutOption} height={220} />
                        <p className="text-center text-xs text-muted-foreground">
                          {formatMoney(currency === "USD" ? selectedRow.actual_usd : selectedRow.actual_crc, currency)} /{" "}
                          {formatMoney(currency === "USD" ? selectedRow.budget_usd : selectedRow.budget, currency)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t.budgetVsActual.noBudgetSet}</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
