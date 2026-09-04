import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, type Category, type CreditCard, type DayExpenses, type Expense } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { localISODate } from "@/lib/date";
import { useExpenseEvents } from "@/lib/events";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/language";
import { ClearExpenseFlagDialog } from "@/components/ClearExpenseFlagDialog";
import { DeleteExpenseDialog } from "@/components/DeleteExpenseDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";
import { ExpenseFrame } from "@/components/expenses/ExpenseFrame";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const WINDOW_DAYS = 14;

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dayLabel(value: string, today: string, yesterday: string, locale: string) {
  const current = localISODate(new Date());
  if (value === current) return today;
  if (value === localISODate(addDays(new Date(), -1))) return yesterday;
  return parseLocalDate(value).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" });
}

function mergeDays(current: DayExpenses[], incoming: DayExpenses[]) {
  const merged = new Map(current.map((day) => [day.date, day]));
  incoming.forEach((day) => merged.set(day.date, day));
  return Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export default function Activity() {
  const { currency } = useCurrency();
  const { language, t } = useLanguage();
  const locale = language === "es" ? "es-CR" : "en-US";
  const today = localISODate(new Date());
  const initialFrom = localISODate(addDays(new Date(), -(WINDOW_DAYS - 1)));
  const [oldestDate, setOldestDate] = React.useState(initialFrom);
  const [days, setDays] = React.useState<DayExpenses[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [creditCards, setCreditCards] = React.useState<CreditCard[]>([]);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [splitTarget, setSplitTarget] = React.useState<Expense | null>(null);
  const [editTarget, setEditTarget] = React.useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null);
  const [clearFlagTarget, setClearFlagTarget] = React.useState<Expense | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const initialLoadStarted = React.useRef(false);

  React.useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
    api.creditCards.list().then(setCreditCards).catch(() => {});
  }, []);

  const loadCurrentWindow = React.useCallback(() => {
    setLoading(true);
    setError(null);
    return api.expenses
      .list({ from: oldestDate, to: today, limit: 1000 })
      .then((response) => setDays(response.days))
      .catch((reason) => setError(reason instanceof Error ? reason.message : t.activity.failedToLoad))
      .finally(() => setLoading(false));
  }, [oldestDate, t.activity.failedToLoad, today]);

  React.useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    loadCurrentWindow();
  }, [loadCurrentWindow]);

  useExpenseEvents(loadCurrentWindow);

  const loadOlder = async () => {
    const olderToDate = addDays(parseLocalDate(oldestDate), -1);
    const olderFromDate = addDays(olderToDate, -(WINDOW_DAYS - 1));
    const from = localISODate(olderFromDate);
    const to = localISODate(olderToDate);
    setLoadingOlder(true);
    setError(null);
    try {
      const response = await api.expenses.list({ from, to, limit: 1000 });
      setDays((current) => mergeDays(current, response.days));
      setOldestDate(from);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.activity.failedToLoad);
    } finally {
      setLoadingOlder(false);
    }
  };

  const groups = React.useMemo(() => {
    const byDate = new Map(days.map((day) => [day.date, day]));
    const result: DayExpenses[] = [];
    for (let cursor = parseLocalDate(today); localISODate(cursor) >= oldestDate; cursor = addDays(cursor, -1)) {
      const date = localISODate(cursor);
      result.push(byDate.get(date) ?? { date, expenses: [], total_crc: 0, total_usd: 0 });
    }
    return result;
  }, [days, oldestDate, today]);

  if (loading && days.length === 0) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label={t.activity.backHome}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <h1 className="text-xl font-semibold">{t.activity.title}</h1>
      </header>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const total = currency === "USD" ? group.total_usd : group.total_crc;
          return (
            <Card key={group.date} className="border-border/80 shadow-sm">
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-baseline justify-between border-b border-border pb-2">
                  <h2 className="text-sm font-semibold capitalize text-foreground">
                    {dayLabel(group.date, t.home.today, t.home.yesterday, locale)}
                  </h2>
                  {group.expenses.length > 0 && (
                    <span className="text-xs font-medium text-muted-foreground">{formatMoney(total, currency)}</span>
                  )}
                </div>

                {group.expenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.activity.noExpensesThisDay}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {group.expenses.map((expense) => (
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
                        className="border-0 bg-secondary/40"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button type="button" variant="outline" onClick={loadOlder} disabled={loadingOlder}>
        {loadingOlder ? t.activity.loadingOlder : t.activity.showOlder}
      </Button>

      {splitTarget && (
        <SplitExpenseDialog
          expense={splitTarget}
          categories={categories}
          onClose={() => setSplitTarget(null)}
          onSplit={() => {
            setSplitTarget(null);
            loadCurrentWindow();
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
            loadCurrentWindow();
          }}
        />
      )}
      {deleteTarget && (
        <DeleteExpenseDialog
          expense={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            loadCurrentWindow();
          }}
        />
      )}
      {clearFlagTarget && (
        <ClearExpenseFlagDialog
          expense={clearFlagTarget}
          onClose={() => setClearFlagTarget(null)}
          onCleared={() => {
            setClearFlagTarget(null);
            loadCurrentWindow();
          }}
        />
      )}
    </div>
  );
}
