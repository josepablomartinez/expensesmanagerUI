import * as React from "react";
import { api, type Expense } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
        const dayTotal = group.items.reduce((sum, e) => sum + (e.amount ?? 0), 0);

        return (
          <div key={group.iso} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">{formatDayLabel(group.iso)}</h2>
              {group.items.length > 0 && (
                <span className="text-xs text-muted-foreground">{dayTotal.toFixed(2)}</span>
              )}
            </div>

            {group.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isToday ? "There are no expenses for today." : "No expenses this day."}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {group.items.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="flex items-center justify-between gap-4 pt-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{expense.commerce ?? expense.entity}</span>
                        <span className="text-xs text-muted-foreground">
                          {expense.category_name ?? "Uncategorized"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!expense.reviewed && expense.confidence != null && (
                          <Badge variant="outline">{Math.round(expense.confidence * 100)}% confident</Badge>
                        )}
                        <span className="font-medium">
                          {expense.currency} {expense.amount?.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <Button variant="outline" onClick={() => setDaysBack((d) => d + PAGE_DAYS)} disabled={loading}>
        {loading ? "Loading…" : "See more"}
      </Button>
    </div>
  );
}
