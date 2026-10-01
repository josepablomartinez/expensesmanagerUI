import * as React from "react";
import { api, ApiError, type Income } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/language";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteIncomeDialog({
  income,
  onClose,
  onDeleted,
}: {
  income: Income;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useT();
  const i = t.income;
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = reason.trim();
    if (!trimmed) return setError(i.reasonRequired);

    setSaving(true);
    try {
      await api.income.delete(income.id, trimmed);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : i.failedToDelete);
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog
      title={i.deleteTitle(income.description || income.category_name)}
      description={
        <>
          <p className="mt-1 text-xs text-muted-foreground">{formatMoney(income.amount, income.currency)}</p>
          {income.linked_expense_id != null && <p className="mt-1 text-xs text-muted-foreground">{i.deleteReimbursementHelp}</p>}
        </>
      }
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <Input
          aria-label={i.reasonPlaceholder}
          placeholder={i.reasonPlaceholder}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" variant="destructive" className="flex-1" disabled={saving}>
            {saving ? t.common.deleting : t.common.delete}
          </Button>
        </div>
      </form>
    </ExpenseDialog>
  );
}
