import * as React from "react";
import { api, type Expense } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const QUERY_DEBOUNCE_MS = 300;
const RESULT_LIMIT = 15;

export function expenseLabel(expense: Expense) {
  return expense.merchant ?? expense.entity;
}

// Search-as-you-type picker for the expense a reimbursement paid back. With
// an empty box it lists the most recent expenses (the API sorts newest
// first). Once one is picked it collapses to a summary with a Change button.
export function ExpensePicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: Expense | null;
  onSelect: (expense: Expense | null) => void;
  disabled?: boolean;
}) {
  const t = useT();
  const i = t.income;
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [results, setResults] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), QUERY_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  React.useEffect(() => {
    if (selected) return;
    let current = true;
    setLoading(true);
    api.expenses
      .list({ from: "2000-01-01", to: "2100-12-31", q: debounced, limit: RESULT_LIMIT })
      .then((res) => {
        if (current) setResults(res.days.flatMap((d) => d.expenses));
      })
      .catch(() => {
        if (current) setResults([]);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [debounced, selected]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-panel border border-border p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{expenseLabel(selected)}</p>
          <p className="text-xs text-muted-foreground">
            {selected.date.slice(0, 10)} · {formatMoney(selected.amount, selected.currency)}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onSelect(null)}>
          {i.changeExpense}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        aria-label={i.expense}
        placeholder={i.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
      />
      <div className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-panel border border-border p-1">
        {loading && results.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">{i.searching}</p>
        ) : results.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">{i.noMatches}</p>
        ) : (
          results.map((expense) => (
            <button
              key={expense.id}
              type="button"
              onClick={() => onSelect(expense)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{expenseLabel(expense)}</span>
                <span className="block text-xs text-muted-foreground">{expense.date.slice(0, 10)}</span>
              </span>
              <span className="shrink-0 text-xs font-medium">{formatMoney(expense.amount, expense.currency)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
