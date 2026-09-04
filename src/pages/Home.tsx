import * as React from "react";
import { api, type Category, type CreditCard, type DayExpenses, type Expense, type Settings } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/language";
import { localISODate as isoDate } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { DeleteExpenseDialog } from "@/components/DeleteExpenseDialog";
import { ClearExpenseFlagDialog } from "@/components/ClearExpenseFlagDialog";
import { Greeting } from "@/components/dashboard/Greeting";
import { ExchangeRateWidget } from "@/components/dashboard/ExchangeRateWidget";
import { FavoriteCategoriesWidget } from "@/components/dashboard/FavoriteCategoriesWidget";
import { ExpenseFrame } from "@/components/expenses/ExpenseFrame";

const PAGE_DAYS = 7;

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function formatDayLabel(iso: string, todayLabel: string, yesterdayLabel: string, locale: string) {
  if (iso === isoDate(new Date())) return todayLabel;
  if (iso === isoDate(addDays(new Date(), -1))) return yesterdayLabel;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, { month: "long", day: "numeric" });
}

interface DayGroup {
  iso: string;
  items: Expense[];
  totalCrc: number;
  totalUsd: number;
}

export default function Home() {
  const { currency } = useCurrency();
  const { language, t } = useLanguage();
  const locale = language === "es" ? "es-CR" : "en-US";
  const [daysBack, setDaysBack] = React.useState(PAGE_DAYS);
  const [days, setDays] = React.useState<DayExpenses[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [creditCards, setCreditCards] = React.useState<CreditCard[]>([]);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [splitTarget, setSplitTarget] = React.useState<Expense | null>(null);
  const [editTarget, setEditTarget] = React.useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null);
  const [clearFlagTarget, setClearFlagTarget] = React.useState<Expense | null>(null);
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
      .then((res) => setDays(res.days))
      .catch((err) => setError(err instanceof Error ? err.message : t.home.failedToLoad))
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
    const byDate = new Map(days.map((d) => [d.date, d]));
    const result: DayGroup[] = [];
    for (let i = 0; i < daysBack; i++) {
      const iso = isoDate(addDays(new Date(), -i));
      const day = byDate.get(iso);
      result.push({ iso, items: day?.expenses ?? [], totalCrc: day?.total_crc ?? 0, totalUsd: day?.total_usd ?? 0 });
    }
    return result;
  }, [days, daysBack]);

  if (loading && days.length === 0) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <Greeting name={settings?.first_name} />

      <ExchangeRateWidget favoriteBanks={settings?.favorite_banks ?? []} />
      <FavoriteCategoriesWidget favoriteCategoryIds={settings?.favorite_category_ids ?? []} />

      <h2 className="text-sm font-semibold text-muted-foreground">{t.home.recentExpenses}</h2>

      {groups.map((group) => {
        const isToday = group.iso === isoDate(new Date());
        const dayTotal = currency === "USD" ? group.totalUsd : group.totalCrc;

        return (
          <Card key={group.iso} className="border-border/80 shadow-sm">
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex items-baseline justify-between border-b border-border pb-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {formatDayLabel(group.iso, t.home.today, t.home.yesterday, locale)}
                </h2>
                {group.items.length > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatMoney(dayTotal, currency)}
                  </span>
                )}
              </div>

              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {isToday ? t.home.noExpensesToday : t.home.noExpensesThisDay}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {group.items.map((expense) => (
                    <ExpenseFrame
                      key={expense.id}
                      expense={expense}
                      creditCards={creditCards}
                      expanded={expandedId === expense.id}
                      onToggle={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                      onEdit={() => setEditTarget(expense)}
                      onSplit={() => setSplitTarget(expense)}
                      onClearFlag={expense.flag_type ? () => setClearFlagTarget(expense) : undefined}
                      onDelete={() => setDeleteTarget(expense)}
                      status={
                        !expense.reviewed && expense.confidence != null ? (
                          <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                            {t.common.confidencePercent(Math.round(expense.confidence * 100))}
                          </span>
                        ) : undefined
                      }
                      className="border-0 bg-secondary/40"
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button variant="outline" onClick={() => setDaysBack((d) => d + PAGE_DAYS)} disabled={loading}>
        {loading ? t.common.loading : t.home.seeMore}
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

      {clearFlagTarget && (
        <ClearExpenseFlagDialog
          expense={clearFlagTarget}
          onClose={() => setClearFlagTarget(null)}
          onCleared={() => {
            setClearFlagTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
