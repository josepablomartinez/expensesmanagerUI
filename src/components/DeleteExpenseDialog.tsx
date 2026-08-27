import * as React from "react";
import { api, type Expense } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  expense: Expense;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteExpenseDialog({ expense, onClose, onDeleted }: Props) {
  const { currency } = useCurrency();
  const equivalent = currency === "CRC" ? expense.colones_amount : expense.dollars_amount;
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Enter a reason for deleting this expense");
      return;
    }

    setSaving(true);
    try {
      await api.expenses.delete(expense.id, { deleted_reason: trimmed });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            Delete "{expense.merchant ?? expense.entity}"
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {formatMoney(expense.amount, expense.currency)}
            {equivalent != null && expense.currency !== currency && (
              <> · {formatMoney(equivalent, currency)}</>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              placeholder="Reason for deleting (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" className="flex-1" disabled={saving}>
                {saving ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
