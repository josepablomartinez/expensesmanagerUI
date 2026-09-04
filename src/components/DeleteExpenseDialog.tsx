import * as React from "react";
import { api, type Expense } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useT } from "@/lib/language";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  expense: Expense;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteExpenseDialog({ expense, onClose, onDeleted }: Props) {
  const { currency } = useCurrency();
  const t = useT();
  const equivalent = currency === "CRC" ? expense.colones_amount : expense.dollars_amount;
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t.dialogs.deleteExpense.reasonRequired);
      return;
    }

    setSaving(true);
    try {
      await api.expenses.delete(expense.id, { deleted_reason: trimmed });
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.dialogs.deleteExpense.failedToDelete);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog
      title={t.dialogs.deleteExpense.title(expense.merchant ?? expense.entity)}
      description={
        <p className="mt-1 text-xs text-muted-foreground">
            {formatMoney(expense.amount, expense.currency)}
            {equivalent != null && expense.currency !== currency && (
              <> · {formatMoney(equivalent, currency)}</>
            )}
        </p>
      }
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              placeholder={t.dialogs.deleteExpense.reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button type="submit" variant="destructive" className="flex-1" disabled={saving}>
                {saving ? t.dialogs.deleteExpense.deleting : t.dialogs.deleteExpense.delete}
              </Button>
            </div>
      </form>
    </ExpenseDialog>
  );
}
