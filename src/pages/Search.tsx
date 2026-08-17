import * as React from "react";
import { api, type Category, type Expense } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

type SortBy = "date" | "amount";
type SortDir = "asc" | "desc";

export default function Search() {
  const [from, setFrom] = React.useState(firstOfMonth());
  const [to, setTo] = React.useState(today());
  const [categoryId, setCategoryId] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortBy>("date");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    api.expenses
      .list({ from, to, categoryId: categoryId ? Number(categoryId) : undefined, limit: 500 })
      .then(setExpenses)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [from, to, categoryId]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = expenses;
    if (q) {
      rows = rows.filter(
        (e) => e.commerce?.toLowerCase().includes(q) || e.motive?.toLowerCase().includes(q),
      );
    }
    const sorted = [...rows].sort((a, b) => {
      const cmp =
        sortBy === "amount"
          ? (a.amount ?? 0) - (b.amount ?? 0)
          : a.date.localeCompare(b.date);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [expenses, query, sortBy, sortDir]);

  const total = results.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Search</h1>

      <div className="flex flex-col gap-2">
        <Input
          placeholder="Search by commerce or note…"
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
          <span className="text-lg font-semibold">{total.toFixed(2)}</span>
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
          {results.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="flex items-center justify-between gap-4 pt-4">
                <div className="flex flex-col">
                  <span className="font-medium">{expense.commerce ?? expense.entity}</span>
                  <span className="text-xs text-muted-foreground">
                    {expense.date.slice(0, 10)} · {expense.category_name ?? "Uncategorized"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!expense.reviewed && <Badge variant="outline">Unreviewed</Badge>}
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
}
