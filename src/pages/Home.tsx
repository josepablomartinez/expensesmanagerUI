import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api, type Category, type CreditCard, type DayExpenses, type Expense, type Settings } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/language";
import { localISODate as isoDate } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { DeleteExpenseDialog } from "@/components/DeleteExpenseDialog";
import { ClearExpenseFlagDialog } from "@/components/ClearExpenseFlagDialog";
import { Greeting } from "@/components/dashboard/Greeting";
import { ExchangeRateWidget } from "@/components/dashboard/ExchangeRateWidget";
import { FavoriteCategoriesWidget } from "@/components/dashboard/FavoriteCategoriesWidget";
import { ExpenseFrame } from "@/components/expenses/ExpenseFrame";

const HOME_WINDOW_DAYS = 30;

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export default function Home() {
  const { currency } = useCurrency();
  const { t } = useLanguage();
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
    const from = isoDate(addDays(new Date(), -(HOME_WINDOW_DAYS - 1)));
    return api.expenses
      .list({ from, to, limit: 500 })
      .then((res) => setDays(res.days))
      .catch((err) => setError(err instanceof Error ? err.message : t.home.failedToLoad))
      .finally(() => setLoading(false));
  }, [t.home.failedToLoad]);

  React.useEffect(() => {
    load();
  }, [load]);

  // New expenses (from the inbox agent or elsewhere) show up here without a
  // manual refresh -- this is the page a user is most likely to be looking
  // at when a card charge comes in.
  useExpenseEvents(load);

  const todayIso = isoDate(new Date());
  const today = days.find((day) => day.date === todayIso);
  const todayExpenses = today?.expenses.slice(0, 3) ?? [];
  const recentExpenses = days
    .filter((day) => day.date !== todayIso)
    .flatMap((day) => day.expenses)
    .slice(0, 3);
  const todayTotal = currency === "USD" ? (today?.total_usd ?? 0) : (today?.total_crc ?? 0);

  if (loading && days.length === 0) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Greeting name={settings?.first_name} />
        <ExchangeRateWidget favoriteBanks={settings?.favorite_banks ?? []} />
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex flex-col gap-3 pt-4">
            <div className="flex items-baseline justify-between border-b border-border pb-2">
              <h2 className="text-sm font-semibold text-foreground">{t.home.today}</h2>
              {todayExpenses.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground">{formatMoney(todayTotal, currency)}</span>
              )}
            </div>
            {todayExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.home.noExpensesToday}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {todayExpenses.map((expense, index) => (
                  <div key={expense.id} className={index === 2 ? "hidden md:block" : undefined}>
                    <ExpenseFrame
                      expense={expense}
                      creditCards={creditCards}
                      expanded={expandedId === expense.id}
                      onToggle={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                      onEdit={() => setEditTarget(expense)}
                      onSplit={() => setSplitTarget(expense)}
                      onClearFlag={expense.flag_type ? () => setClearFlagTarget(expense) : undefined}
                      onDelete={() => setDeleteTarget(expense)}
                      className="border-0 bg-secondary/40"
                    />
                  </div>
                ))}
              </div>
            )}
            <Link to="/activity" className="flex items-center justify-end gap-1 text-sm font-medium text-primary hover:underline">
              {t.home.viewAllExpenses}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <FavoriteCategoriesWidget favoriteCategoryIds={settings?.favorite_category_ids ?? []} />
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex flex-col gap-3 pt-4">
          <h2 className="border-b border-border pb-2 text-sm font-semibold text-foreground">{t.home.recentExpenses}</h2>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.home.noExpensesThisDay}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentExpenses.map((expense, index) => (
                <div key={expense.id} className={index === 2 ? "hidden md:block" : undefined}>
                  <ExpenseFrame
                    expense={expense}
                    creditCards={creditCards}
                    expanded={expandedId === expense.id}
                    onToggle={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                    onEdit={() => setEditTarget(expense)}
                    onSplit={() => setSplitTarget(expense)}
                    onClearFlag={expense.flag_type ? () => setClearFlagTarget(expense) : undefined}
                    onDelete={() => setDeleteTarget(expense)}
                    showDate
                    className="border-0 bg-secondary/40"
                  />
                </div>
              ))}
            </div>
          )}
          <Link to="/activity" className="flex items-center justify-end gap-1 text-sm font-medium text-primary hover:underline">
            {t.home.viewAllExpenses}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>

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
