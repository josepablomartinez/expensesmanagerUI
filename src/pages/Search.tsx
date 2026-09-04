import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api, type Category, type CreditCard, type Expense } from "@/lib/api";
import { formatMoney, expenseValue } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useT } from "@/lib/language";
import { localISODate, monthRange } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { DeleteExpenseDialog } from "@/components/DeleteExpenseDialog";
import { ClearExpenseFlagDialog } from "@/components/ClearExpenseFlagDialog";
import { ExpenseFrame } from "@/components/expenses/ExpenseFrame";

function firstOfMonth() {
  const d = new Date();
  return localISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function today() {
  return localISODate(new Date());
}

type SortBy = "date" | "amount";
type SortDir = "asc" | "desc";
type QuickRange = "" | "0" | "1" | "2";

export default function Search() {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const t = useT();
  const [from, setFrom] = React.useState(firstOfMonth());
  const [to, setTo] = React.useState(today());
  const [quickRange, setQuickRange] = React.useState<QuickRange>("");
  const [categoryId, setCategoryId] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortBy>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

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
      <h1 className="text-xl font-semibold">{t.search.title}</h1>

      <div className="flex flex-col gap-2">
        <Input
          placeholder={t.search.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setQuickRange("");
            }}
            className="w-40"
          />
          <span className="text-muted-foreground">{t.search.to}</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setQuickRange("");
            }}
            className="w-40"
          />

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
            className="w-40"
          >
            <option value="">{t.search.quickRange}</option>
            <option value="0">{t.search.thisMonth}</option>
            <option value="1">{t.search.lastMonth}</option>
            <option value="2">{t.search.secondLastMonth}</option>
          </Select>

          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-48">
            <option value="">{t.search.allCategories}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category} / {c.subcategory}
              </option>
            ))}
          </Select>

          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="w-32">
            <option value="date">{t.search.sortByDate}</option>
            <option value="amount">{t.search.sortByAmount}</option>
          </Select>
          <Select value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)} className="w-28">
            <option value="desc">{t.search.descending}</option>
            <option value="asc">{t.search.ascending}</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between pt-4">
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
