import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Flame } from "lucide-react";
import { api, type BudgetVsActual } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { splitCategoryName } from "@/lib/categoryGrouping";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// pct_used comes back from fn_budget_vs_actual already scaled 0-100 -- same
// severity convention as the Budget vs actual report page.
function severityBarClass(pct: number) {
  if (pct >= 100) return "bg-red-600";
  if (pct >= 90) return "bg-red-400";
  if (pct >= 75) return "bg-amber-500";
  return "bg-primary";
}

export function FavoriteCategoriesWidget({ favoriteCategoryIds }: { favoriteCategoryIds: number[] }) {
  const navigate = useNavigate();
  const [rows, setRows] = React.useState<BudgetVsActual[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (favoriteCategoryIds.length === 0) {
      setLoading(false);
      return;
    }
    const now = new Date();
    api.reports
      .budgetVsActual(now.getFullYear(), now.getMonth() + 1)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favoriteCategoryIds]);

  if (favoriteCategoryIds.length === 0) return null;

  const filtered = rows.filter((r) => favoriteCategoryIds.includes(r.category_id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Favorite categories — this month</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data for your favorite categories yet.</p>
        ) : (
          filtered.map((row) => {
            const pct = row.pct_used ?? 0;
            const over = pct >= 100;
            return (
              <div
                key={row.category_id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/reports/budget-vs-actual?category=${row.category_id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/reports/budget-vs-actual?category=${row.category_id}`);
                  }
                }}
                className="-mx-1.5 flex cursor-pointer flex-col gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-secondary/40"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{splitCategoryName(row.category_name).subName}</span>
                  <span className="text-muted-foreground">
                    {formatMoney(row.actual_crc, "CRC")}
                    {row.budget != null ? ` / ${formatMoney(row.budget, "CRC")}` : ""}
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
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
