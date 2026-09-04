import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { api, type Category, type CreditCard, type Expense } from "@/lib/api";
import { formatMoney, expenseValue } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useT } from "@/lib/language";
import { localISODate, monthRange } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { DeleteExpenseDialog } from "@/components/DeleteExpenseDialog";
import { ClearExpenseFlagDialog } from "@/components/ClearExpenseFlagDialog";
import { ExpenseFrame } from "@/components/expenses/ExpenseFrame";
import { useExpenseEvents } from "@/lib/events";
import { cn } from "@/lib/utils";

function firstOfMonth() {
  const d = new Date();
  return localISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function today() {
  return localISODate(new Date());
}

function ninetyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return localISODate(d);
}

type SortBy = "date" | "amount";
type SortDir = "asc" | "desc";
type QuickRange = "" | "0" | "1" | "2";

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedExpenseId = Number(searchParams.get("expense")) || null;
  const { currency } = useCurrency();
  const t = useT();
  const [from, setFrom] = React.useState(focusedExpenseId ? ninetyDaysAgo() : firstOfMonth());
  const [to, setTo] = React.useState(today());
  const [quickRange, setQuickRange] = React.useState<QuickRange>("");
  const [categoryId, setCategoryId] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortBy>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [creditCards, setCreditCards] = React.useState<CreditCard[]>([]);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [splitTarget, setSplitTarget] = React.useState<Expense | null>(null);
  const [editTarget, setEditTarget] = React.useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Expense | null>(null);
  const [clearFlagTarget, setClearFlagTarget] = React.useState<Expense | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
    api.creditCards.list().then(setCreditCards).catch(() => {});
  }, []);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    return api.expenses
      .list({ from, to, categoryId: categoryId ? Number(categoryId) : undefined, limit: 500 })
      .then((res) => setExpenses(res.days.flatMap((d) => d.expenses)))
      .catch((err) => setError(err instanceof Error ? err.message : t.search.failedToLoad))
      .finally(() => setLoading(false));
  }, [from, to, categoryId]);

  React.useEffect(() => {
    load();
  }, [load]);

  useExpenseEvents(load);

  React.useEffect(() => {
    if (!focusedExpenseId || !expenses.some((expense) => expense.id === focusedExpenseId)) return;
    setExpandedId(focusedExpenseId);
    requestAnimationFrame(() => document.getElementById(`expense-${focusedExpenseId}`)?.scrollIntoView({ block: "center" }));
  }, [expenses, focusedExpenseId]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = expenses;
    if (q) {
      rows = rows.filter(
        (e) => e.merchant?.toLowerCase().includes(q) || e.motive?.toLowerCase().includes(q),
      );
    }
    const sorted = [...rows].sort((a, b) => {
      const cmp =
        sortBy === "amount"
          ? expenseValue(a, currency) - expenseValue(b, currency)
          : a.date.localeCompare(b.date);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [expenses, query, sortBy, sortDir, currency]);

  const total = results.reduce((sum, e) => sum + expenseValue(e, currency), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t.search.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.search.subtitle}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="search-filters"
          className="md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {t.search.filters}
        </Button>
      </div>

      <div
        id="search-filters"
        className={cn(
          "flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm",
          filtersOpen ? "flex" : "hidden",
          "md:flex",
        )}
      >
        <Input
          placeholder={t.search.searchPlaceholder}
          aria-label={t.search.searchLabel}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            {t.search.from}
            <Input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setQuickRange("");
              }}
              className="w-full"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            {t.search.to}
            <Input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setQuickRange("");
              }}
              className="w-full"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            {t.search.quickRange}
            <Select
              value={quickRange}
              onChange={(e) => {
                const v = e.target.value as QuickRange;
                setQuickRange(v);
                if (v === "") return;
                const r = monthRange(Number(v));
                setFrom(r.from);
                setTo(r.to);
              }}
              className="w-full"
            >
              <option value="">{t.search.customRange}</option>
              <option value="0">{t.search.thisMonth}</option>
              <option value="1">{t.search.lastMonth}</option>
              <option value="2">{t.search.secondLastMonth}</option>
            </Select>
          </label>

          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            {t.search.category}
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full">
              <option value="">{t.search.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category} / {c.subcategory}</option>
              ))}
            </Select>
          </label>

          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            {t.search.sort}
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="w-full">
              <option value="date">{t.search.sortByDate}</option>
              <option value="amount">{t.search.sortByAmount}</option>
            </Select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            {t.search.direction}
            <Select value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)} className="w-full">
              <option value="desc">{t.search.descending}</option>
              <option value="asc">{t.search.ascending}</option>
            </Select>
          </label>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="flex items-center justify-between gap-3 pt-4">
          <span className="text-sm text-muted-foreground">{t.search.expensesCount(results.length)}</span>
          <span className="text-lg font-semibold">{formatMoney(total, currency)}</span>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.search.noExpensesMatch}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((expense) => (
            <div key={expense.id} id={`expense-${expense.id}`} className={cn(expense.id === focusedExpenseId && "rounded-lg ring-2 ring-ring ring-offset-2 ring-offset-background")}>
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
              status={
                !expense.reviewed ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/review?focus=${expense.id}`)}
                    aria-label={t.search.goToReview}
                  >
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      {t.search.unreviewed}
                    </Badge>
                  </button>
                ) : undefined
              }
            />
            </div>
          ))}
        </div>
      )}

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
