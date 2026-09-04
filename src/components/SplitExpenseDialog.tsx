import * as React from "react";
import { api, type Category, type Expense } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useT } from "@/lib/language";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
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
  const { currency } = useCurrency();
  const t = useT();
  const equivalent = currency === "CRC" ? expense.colones_amount : expense.dollars_amount;
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
      setError(t.dialogs.splitExpense.enterValidAmount);
      return;
    }
    if (expense.amount != null && parsed >= expense.amount) {
      setError(t.dialogs.splitExpense.amountMustBeLess);
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
      setError(err instanceof Error ? err.message : t.dialogs.splitExpense.failedToSplit);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog
      title={t.dialogs.splitExpense.title(expense.merchant ?? expense.entity)}
      description={
        <p className="mt-1 text-xs text-muted-foreground">
            {t.dialogs.splitExpense.total} {formatMoney(expense.amount, expense.currency)}
            {equivalent != null && expense.currency !== currency && (
              <> · {formatMoney(equivalent, currency)}</>
            )}
        </p>
      }
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              placeholder={t.dialogs.splitExpense.amountToSplitOff}
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t.common.uncategorized}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category} / {c.subcategory}
                </option>
              ))}
            </Select>
            {!categoryId && (
              <p className="-mt-1 text-xs text-muted-foreground">
                {t.dialogs.splitExpense.leftUncategorizedNote}
              </p>
            )}
            <Input placeholder={t.dialogs.splitExpense.reasonPlaceholder} value={reason} onChange={(e) => setReason(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? t.dialogs.splitExpense.splitting : t.dialogs.splitExpense.split}
              </Button>
            </div>
      </form>
    </ExpenseDialog>
  );
}
