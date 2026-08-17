import * as React from "react";
import { api, type Category, type Expense } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Review() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewRows, categoryRows] = await Promise.all([api.expenses.review(0.7), api.categories.list()]);
      setExpenses(reviewRows);
      setCategories(categoryRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Reload the queue whenever the inbox agent (or anything else) inserts a
  // new expense, instead of the user having to refresh to see it. A refetch
  // is cheap here and keeps min_confidence filtering in one place (the SQL
  // function) rather than duplicating it client-side.
  useExpenseEvents(load);

  async function assignCategory(id: number, categoryId: number) {
    await api.expenses.updateCategory(id, categoryId);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  async function approveAll() {
    if (expenses.length === 0) return;
    await api.expenses.bulkApprove(expenses.map((e) => e.id));
    setExpenses([]);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Review queue</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{expenses.length} pending</Badge>
          <Button size="sm" variant="outline" onClick={approveAll} disabled={expenses.length === 0}>
            Approve all
          </Button>
        </div>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to review.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="flex items-center justify-between gap-4 pt-4">
                <div className="flex flex-col">
                  <span className="font-medium">{expense.commerce ?? expense.entity}</span>
                  <span className="text-xs text-muted-foreground">
                    {expense.date.slice(0, 10)} · {expense.currency} {expense.amount?.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {expense.confidence != null && (
                    <Badge variant="outline">{Math.round(expense.confidence * 100)}% confident</Badge>
                  )}
                  <Select
                    defaultValue={expense.category_id ?? ""}
                    onChange={(e) => assignCategory(expense.id, Number(e.target.value))}
                  >
                    <option value="" disabled>
                      Choose category
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category} / {c.subcategory}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
