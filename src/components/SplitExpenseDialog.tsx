import * as React from "react";
import { api, type Category, type Expense } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Props {
  expense: Expense;
  categories: Category[];
  onClose: () => void;
  onSplit: () => void;
}

export function SplitExpenseDialog({ expense, categories, onClose, onSplit }: Props) {
  const [amount, setAmount] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (expense.amount != null && parsed >= expense.amount) {
      setError("Split amount must be less than the full expense amount");
      return;
    }

    setSaving(true);
    try {
      await api.expenses.split(expense.id, {
        amount: parsed,
        category_id: categoryId ? Number(categoryId) : undefined,
        reason: reason || undefined,
      });
      onSplit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to split expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            Split "{expense.commerce ?? expense.entity}"
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Total {formatMoney(expense.amount, expense.currency)}
            {expense.colones_amount != null && expense.currency !== "CRC" && (
              <> · {formatMoney(expense.colones_amount, "CRC")}</>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              placeholder="Amount to split off"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category} / {c.subcategory}
                </option>
              ))}
            </Select>
            {!categoryId && (
              <p className="-mt-1 text-xs text-muted-foreground">
                Left uncategorized, so it'll show up in Review.
              </p>
            )}
            <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Splitting…" : "Split"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
