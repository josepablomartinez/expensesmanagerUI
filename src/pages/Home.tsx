import * as React from "react";
import { Split } from "lucide-react";
import { api, type Category, type Expense } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";
import { formatMoney, formatExpenseAmount, crcValue } from "@/lib/format";
import { getCategoryIcon, mainCategoryOf } from "@/lib/categoryIcons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";

const PAGE_DAYS = 7;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function formatDayLabel(iso: string) {
  if (iso === isoDate(new Date())) return "Today";
  if (iso === isoDate(addDays(new Date(), -1))) return "Yesterday";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

interface DayGroup {
  iso: string;
  items: Expense[];
}

export default function Home() {
  const [daysBack, setDaysBack] = React.useState(PAGE_DAYS);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [splitTarget, setSplitTarget] = React.useState<Expense | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    const to = isoDate(new Date());
    const from = isoDate(addDays(new Date(), -(daysBack - 1)));
    return api.expenses
      .list({ from, to, limit: 500 })
      .then(setExpenses)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [daysBack]);

  React.useEffect(() => {
    load();
  }, [load]);

  // New expenses (from the inbox agent or elsewhere) show up here without a
  // manual refresh -- this is the page a user is most likely to be looking
  // at when a card charge comes in.
  useExpenseEvents(load);

  const groups = React.useMemo<DayGroup[]>(() => {
    const byDate = new Map<string, Expense[]>();
    for (const e of expenses) {
      const day = e.date.slice(0, 10);
      if (!byDate.has(day)) byDate.set(day, []);
      byDate.get(day)!.push(e);
    }
    const days: DayGroup[] = [];
    for (let i = 0; i < daysBack; i++) {
      const iso = isoDate(addDays(new Date(), -i));
      days.push({ iso, items: byDate.get(iso) ?? [] });
    }
    return days;
  }, [expenses, daysBack]);

  if (loading && expenses.length === 0) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Expenses</h1>

      {groups.map((group) => {
        const isToday = group.iso === isoDate(new Date());
        const dayTotal = group.items.reduce((sum, e) => sum + crcValue(e), 0);

        return (
          <Card key={group.iso} className="border-border/80 shadow-sm">
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-baseline justify-between border-b border-border pb-2">
                <h2 className="text-sm font-semibold text-foreground">{formatDayLabel(group.iso)}</h2>
                {group.items.length > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatMoney(dayTotal, "CRC")}
                  </span>
                )}
              </div>

              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isToday ? "There are no expenses for today." : "No expenses this day."}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {group.items.map((expense) => {
                    const Icon = getCategoryIcon(mainCategoryOf(expense.category_name));
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between gap-4 rounded-md bg-secondary/40 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="flex flex-col">
                            <span className="font-medium">{expense.commerce ?? expense.entity}</span>
                            <span className="text-xs text-muted-foreground">
                              {expense.category_name ?? "Uncategorized"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!expense.reviewed && expense.confidence != null && (
                            <Badge variant="outline">{Math.round(expense.confidence * 100)}% confident</Badge>
                          )}
                          <span className="font-medium">{formatExpenseAmount(expense)}</span>
                          {expense.reviewed && (
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Split expense"
                              onClick={() => setSplitTarget(expense)}
                            >
                              <Split className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button variant="outline" onClick={() => setDaysBack((d) => d + PAGE_DAYS)} disabled={loading}>
        {loading ? "Loading…" : "See more"}
      </Button>

      {splitTarget && (
        <SplitExpenseDialog
          expense={splitTarget}
          categories={categories}
          onClose={() => setSplitTarget(null)}
          onSplit={() => {
            setSplitTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
