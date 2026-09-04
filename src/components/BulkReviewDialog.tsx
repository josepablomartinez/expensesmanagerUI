import * as React from "react";
import { api, type Category, type Expense } from "@/lib/api";
import { formatExpenseAmount } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useT } from "@/lib/language";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface BulkReviewDialogProps {
  expenses: Expense[];
  categories: Category[];
  onClose: () => void;
  onApproved: (count: number, ruleFailures: number) => void;
}

export function BulkReviewDialog({ expenses, categories, onClose, onApproved }: BulkReviewDialogProps) {
  const { currency } = useCurrency();
  const t = useT();
  const [categoryById, setCategoryById] = React.useState<Record<number, string>>(() =>
    Object.fromEntries(expenses.map((expense) => [expense.id, expense.category_id ? String(expense.category_id) : ""])),
  );
  const [alwaysById, setAlwaysById] = React.useState<Record<number, boolean>>({});
  const [confirming, setConfirming] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const allCategorized = expenses.every((expense) => Boolean(categoryById[expense.id]));

  const approve = async () => {
    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        expenses.map((expense) => api.expenses.updateCategory(expense.id, Number(categoryById[expense.id]))),
      );
      const rules = expenses.filter((expense) => alwaysById[expense.id] && expense.merchant);
      const ruleResults = await Promise.allSettled(
        rules.map((expense) =>
          api.merchantRules.create({ commercePattern: expense.merchant!, categoryId: Number(categoryById[expense.id]) }),
        ),
      );
      onApproved(expenses.length, ruleResults.filter((result) => result.status === "rejected").length);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.review.failedToApprove);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ExpenseDialog
      title={confirming ? t.review.bulk.confirmTitle(expenses.length) : t.review.bulk.title}
      description={<p className="mt-1 text-xs text-muted-foreground">{confirming ? t.review.bulk.confirmHelp : t.review.bulk.help}</p>}
      onClose={onClose}
      className="max-w-3xl"
    >
      {confirming ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm">{t.review.bulk.confirmBody(expenses.length)}</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={saving}>
              {t.review.bulk.back}
            </Button>
            <Button type="button" onClick={approve} disabled={saving}>
              {saving ? t.review.bulk.approving : t.review.bulk.confirm(expenses.length)}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-border">
            {expenses.map((expense, index) => (
              <div
                key={expense.id}
                className="grid gap-3 border-t border-border p-3 first:border-t-0 md:grid-cols-[minmax(0,1fr)_minmax(14rem,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{expense.merchant ?? expense.entity}</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.date.slice(0, 10)} · {formatExpenseAmount(expense, currency)}
                  </p>
                </div>
                <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
                  {t.review.bulk.category}
                  <Select
                    value={categoryById[expense.id] ?? ""}
                    onChange={(event) => setCategoryById((current) => ({ ...current, [expense.id]: event.target.value }))}
                    className="w-full"
                    autoFocus={index === 0}
                  >
                    <option value="" disabled>{t.review.chooseCategory}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.category} / {category.subcategory}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="flex min-h-9 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
                    checked={alwaysById[expense.id] ?? false}
                    disabled={!expense.merchant}
                    onChange={(event) => setAlwaysById((current) => ({ ...current, [expense.id]: event.target.checked }))}
                  />
                  {t.review.always}
                </label>
              </div>
            ))}
          </div>
          {!allCategorized && <p className="text-xs text-muted-foreground">{t.review.bulk.chooseAll}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>{t.common.cancel}</Button>
            <Button type="button" onClick={() => setConfirming(true)} disabled={!allCategorized}>
              {t.review.bulk.continue}
            </Button>
          </div>
        </div>
      )}
    </ExpenseDialog>
  );
}
