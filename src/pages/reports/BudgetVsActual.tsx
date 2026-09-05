import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Flame } from "lucide-react";
import { api, type BudgetVsActual as BudgetVsActualRow } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useCurrency, type DisplayCurrency } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PeriodSelect } from "@/components/reports/PeriodSelect";
import { cn } from "@/lib/utils";
import { groupByMainCategory, splitCategoryName } from "@/lib/categoryGrouping";
import { useT } from "@/lib/language";

function severityBarClass(pct: number) {
  if (pct >= 100) return "bg-destructive";
  if (pct >= 90) return "bg-warning";
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
  }, [year, month, t.budgetVsActual.failedToLoad]);

  const groups = React.useMemo(() => groupByMainCategory(rows), [rows]);
  React.useEffect(() => {
    setSelectedMainId((current) => groups.some((group) => group.mainCategoryId === current) ? current : (groups[0]?.mainCategoryId ?? null));
  }, [groups]);
  React.useEffect(() => {
    const group = groups.find((item) => item.mainCategoryId === selectedMainId);
    setSelectedSubId((current) => group?.subcategories.some((row) => row.category_id === current) ? current : (group?.subcategories[0]?.category_id ?? null));
  }, [groups, selectedMainId]);
  React.useEffect(() => {
    const categoryId = Number(searchParams.get("category"));
    if (!categoryId) return;
    const row = rows.find((item) => item.category_id === categoryId);
    if (row?.main_category_id != null) {
      setSelectedMainId(row.main_category_id);
      setSelectedSubId(row.category_id);
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [rows, searchParams]);

  const selectedGroup = groups.find((group) => group.mainCategoryId === selectedMainId) ?? null;
  const selectedRow = selectedGroup?.subcategories.find((row) => row.category_id === selectedSubId) ?? null;
  const highestUsed = React.useMemo(() => rows.filter((row) => (row.pct_used ?? 0) > 0).sort((a, b) => (b.pct_used ?? 0) - (a.pct_used ?? 0)), [rows]);

  function selectRow(row: BudgetVsActualRow) {
    if (row.main_category_id == null) return;
    setSelectedMainId(row.main_category_id);
    setSelectedSubId(row.category_id);
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">{t.budgetVsActual.title}</h2>
        <PeriodSelect year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </div>
      {loading ? <p className="text-sm text-muted-foreground">{t.common.loading}</p> : error ? <p className="text-sm text-destructive">{error}</p> : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
          <section className="flex min-w-0 flex-col gap-4" aria-labelledby="budget-ranking-title">
            <div>
              <h3 id="budget-ranking-title" className="font-medium">{t.budgetVsActual.highestUsed}</h3>
              <p className="text-sm text-muted-foreground">{t.budgetVsActual.rankingDescription}</p>
            </div>
            {highestUsed.length === 0 ? <Card><CardContent className="pt-4 text-sm text-muted-foreground">{groups.length ? t.budgetVsActual.noUsage : t.budgetVsActual.noBudgetedCategories}</CardContent></Card> : (
              <div className="flex flex-col gap-2">
                {highestUsed.slice(0, visibleCount).map((row, index) => {
                  const pct = row.pct_used ?? 0;
                  const over = pct >= 100;
                  const actual = currency === "USD" ? row.actual_usd : row.actual_crc;
                  const budget = currency === "USD" ? row.budget_usd : row.budget;
                  return (
                    <button key={row.category_id} type="button" onClick={() => selectRow(row)} aria-pressed={row.category_id === selectedSubId} className={cn("rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", row.category_id === selectedSubId && "border-primary/60 bg-primary/5")}>
                      <div className="flex flex-col gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">{index + 1}</span>
                          <span className="min-w-0 flex-1 truncate font-medium">{row.category_name}</span>
                          <span className={cn("shrink-0 text-sm font-semibold", over && "text-destructive")}>{Math.round(pct)}%</span>
                        </div>
                        <div className="flex items-center gap-2"><div className="h-2 w-full overflow-hidden rounded-full bg-secondary"><div className={cn("h-full rounded-full", severityBarClass(pct))} style={{ width: `${Math.min(pct, 100)}%` }} /></div>{over && <Flame className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />}</div>
                        <div className="flex justify-between gap-3 pl-10 text-xs text-muted-foreground"><span>{t.budgetVsActual.spent}: {formatMoney(actual, currency)}</span><span className="text-right">{t.budgetVsActual.budget}: {budget != null ? formatMoney(budget, currency) : "—"}</span></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {highestUsed.length > visibleCount && <Button variant="outline" size="sm" onClick={() => setVisibleCount((count) => count + 5)}>{t.budgetVsActual.seeMore}</Button>}
          </section>

          <div ref={detailRef} className="scroll-mt-24 md:sticky md:top-6">
            <Card><CardContent className="flex flex-col gap-3 pt-4">
              <div><h3 className="font-medium">{t.budgetVsActual.detail}</h3><p className="text-sm text-muted-foreground">{t.budgetVsActual.detailDescription}</p></div>
              {groups.length === 0 ? <p className="text-sm text-muted-foreground">{t.budgetVsActual.noBudgetedCategories}</p> : <>
                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">{t.budgetVsActual.category}<Select value={selectedMainId ?? ""} onChange={(e) => setSelectedMainId(Number(e.target.value))}>{groups.map((group) => <option key={group.mainCategoryId} value={group.mainCategoryId}>{group.mainName}</option>)}</Select></label>
                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">{t.budgetVsActual.subcategory}<Select value={selectedSubId ?? ""} onChange={(e) => setSelectedSubId(Number(e.target.value))}>{selectedGroup?.subcategories.map((row) => <option key={row.category_id} value={row.category_id}>{splitCategoryName(row.category_name).subName}</option>)}</Select></label>
                <BudgetDetail row={selectedRow} currency={currency} labels={t.budgetVsActual} />
              </>}
            </CardContent></Card>
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetDetail({ row, currency, labels }: { row: BudgetVsActualRow | null; currency: DisplayCurrency; labels: ReturnType<typeof useT>["budgetVsActual"] }) {
  const budget = currency === "USD" ? row?.budget_usd : row?.budget;
  if (!row || budget == null) return <p className="text-sm text-muted-foreground">{labels.noBudgetSet}</p>;
  const actual = currency === "USD" ? row.actual_usd : row.actual_crc;
  const pct = row.pct_used ?? 0;
  const overAmount = Math.max(actual - budget, 0);
  const remaining = Math.max(budget - actual, 0);
  return (
    <div className="mt-2 flex flex-col gap-4 rounded-lg bg-secondary/45 p-4">
      <div className="flex items-end justify-between gap-3"><div><p className={cn("text-3xl font-semibold tracking-tight", pct >= 100 && "text-destructive")}>{Math.round(pct)}%</p><p className="text-xs text-muted-foreground">{labels.used}</p></div>{pct >= 100 && <span className="text-xs font-medium text-destructive">{labels.overBudget}</span>}</div>
      <div className="h-2.5 overflow-hidden rounded-full bg-background"><div className={cn("h-full rounded-full", severityBarClass(pct))} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">{labels.spent}</dt><dd className="font-medium">{formatMoney(actual, currency)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{labels.budget}</dt><dd className="font-medium">{formatMoney(budget, currency)}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-muted-foreground">{overAmount > 0 ? labels.overBudget : labels.remaining}</dt><dd className={cn("font-medium", overAmount > 0 && "text-destructive")}>{formatMoney(overAmount > 0 ? overAmount : remaining, currency)}</dd></div>
      </dl>
    </div>
  );
}
