import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Split, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { api, type Category, type CreditCard, type Expense } from "@/lib/api";
import { formatMoney, formatExpenseAmount, crcValue } from "@/lib/format";
import { getCategoryIcon, mainCategoryOf } from "@/lib/categoryIcons";
import { localISODate } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";
import { DeleteExpenseDialog } from "@/components/DeleteExpenseDialog";
import { ExpenseDetailPanel } from "@/components/expenses/ExpenseDetailPanel";

function firstOfMonth() {
  const d = new Date();
  return localISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function today() {
  return localISODate(new Date());
}

type SortBy = "date" | "amount";
type SortDir = "asc" | "desc";

export default function Search() {
  const navigate = useNavigate();
  const [from, setFrom] = React.useState(firstOfMonth());
  const [to, setTo] = React.useState(today());
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
      .then(setExpenses)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
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
          ? crcValue(a) - crcValue(b)
          : a.date.localeCompare(b.date);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [expenses, query, sortBy, sortDir]);

  const total = results.reduce((sum, e) => sum + crcValue(e), 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Search</h1>

      <div className="flex flex-col gap-2">
        <Input
          placeholder="Search by merchant or note…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          <span className="text-muted-foreground">to</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />

          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-48">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category} / {c.subcategory}
              </option>
            ))}
          </Select>

          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="w-32">
            <option value="date">Sort by date</option>
            <option value="amount">Sort by amount</option>
          </Select>
          <Select value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)} className="w-28">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between pt-4">
          <span className="text-sm text-muted-foreground">{results.length} expenses</span>
          <span className="text-lg font-semibold">{formatMoney(total, "CRC")}</span>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No expenses match your search.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((expense) => {
            const Icon = getCategoryIcon(mainCategoryOf(expense.category_name));
            const isExpanded = expandedId === expense.id;
            return (
              <Card key={expense.id}>
                <CardContent className="pt-4">
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
                          {expense.date.slice(0, 10)} · {expense.category_name ?? "Uncategorized"}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {expense.flag_type && (
                        <Badge variant="destructive" title={expense.flag_reason ?? undefined}>
                          Possible duplicate
                        </Badge>
                      )}
                      {!expense.reviewed && (
                        <button
                          type="button"
                          onClick={() => navigate(`/review?focus=${expense.id}`)}
                          aria-label="Go to this expense in Review"
                        >
                          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                            Unreviewed
                          </Badge>
                        </button>
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
                </CardContent>
              </Card>
            );
          })}
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
    </div>
  );
}
