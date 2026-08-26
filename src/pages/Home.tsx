import * as React from "react";
import { Split, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { api, type Category, type CreditCard, type Expense, type Settings } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";
import { formatMoney, formatExpenseAmount, crcValue } from "@/lib/format";
import { getCategoryIcon, mainCategoryOf } from "@/lib/categoryIcons";
import { localISODate as isoDate } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { DeleteExpenseDialog } from "@/components/DeleteExpenseDialog";
import { Greeting } from "@/components/dashboard/Greeting";
import { ExchangeRateWidget } from "@/components/dashboard/ExchangeRateWidget";
import { FavoriteCategoriesWidget } from "@/components/dashboard/FavoriteCategoriesWidget";
import { ExpenseDetailPanel } from "@/components/expenses/ExpenseDetailPanel";

const PAGE_DAYS = 7;

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
  const [creditCards, setCreditCards] = React.useState<CreditCard[]>([]);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [splitTarget, setSplitTarget] = React.useState<Expense | null>(null);
  const [editTarget, setEditTarget] = React.useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState<Settings | null>(null);

  React.useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
    api.settings.get().then(setSettings).catch(() => {});
    api.creditCards.list().then(setCreditCards).catch(() => {});
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
      <Greeting name={settings?.first_name} />

      <ExchangeRateWidget favoriteBanks={settings?.favorite_banks ?? []} />
      <FavoriteCategoriesWidget favoriteCategoryIds={settings?.favorite_category_ids ?? []} />

      <h2 className="text-sm font-semibold text-muted-foreground">Recent expenses</h2>

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
                    const isExpanded = expandedId === expense.id;
                    return (
                      <div key={expense.id} className="rounded-md bg-secondary/40 px-3 py-2">
                        <div className="flex items-center justify-between gap-4">
                          <button
                            type="button"
                            className="flex flex-1 items-center gap-3 text-left"
                            onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                            aria-expanded={isExpanded}
                            aria-label="Toggle expense details"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium">{expense.merchant ?? expense.entity}</span>
                              <span className="text-xs text-muted-foreground">
                                {expense.category_name ?? "Uncategorized"}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          <div className="flex items-center gap-2">
                            {!expense.reviewed && expense.confidence != null && (
                              <Badge variant="outline">{Math.round(expense.confidence * 100)}% confident</Badge>
                            )}
                            <span className="font-medium">{formatExpenseAmount(expense)}</span>
                            {expense.reviewed && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Edit category"
                                  onClick={() => setEditTarget(expense)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Split expense"
                                  onClick={() => setSplitTarget(expense)}
                                >
                                  <Split className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Delete expense"
                                  onClick={() => setDeleteTarget(expense)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {isExpanded && <ExpenseDetailPanel expense={expense} creditCards={creditCards} />}
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

      {editTarget && (
        <EditCategoryDialog
          expense={editTarget}
          categories={categories}
          onClose={() => setEditTarget(null)}
          onSave={() => {
            setEditTarget(null);
            load();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteExpenseDialog
          expense={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
