import * as React from "react";
import { api, type Expense } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Expenses() {
  const [from, setFrom] = React.useState(firstOfMonth());
  const [to, setTo] = React.useState(today());
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    return api.expenses
      .list({ from, to, limit: 200 })
      .then(setExpenses)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [from, to]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Reload when a new expense lands -- it may fall inside the current
  // from/to range (e.g. today's date), so just refetch rather than trying
  // to guess client-side whether it belongs in the visible list.
  useExpenseEvents(load);

  const total = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <div className="flex items-center gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          <span className="text-muted-foreground">to</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between pt-4">
          <span className="text-sm text-muted-foreground">{expenses.length} expenses</span>
          <span className="text-lg font-semibold">{total.toFixed(2)}</span>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {expenses.map((expense) => (
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
