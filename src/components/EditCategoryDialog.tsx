import * as React from "react";
import { api, type Category, type Expense } from "@/lib/api";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useT } from "@/lib/language";

interface Props {
  expense: Expense;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

export function EditCategoryDialog({ expense, categories, onClose, onSave }: Props) {
  const t = useT();
  const [categoryId, setCategoryId] = React.useState(
    expense.category_id ? String(expense.category_id) : "",
  );
  // expense.motive is what GET /expenses returns for the underlying `reason`
  // column -- PUT /expenses/{id} just names the same field "reason".
  const [reason, setReason] = React.useState(expense.motive ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError(t.dialogs.editCategory.chooseCategoryRequired);
      return;
    }

    setSaving(true);
    try {
      await api.expenses.update(expense.id, { categoryId: Number(categoryId), reason });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.dialogs.editCategory.failedToUpdate);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog title={t.dialogs.editCategory.title(expense.merchant ?? expense.entity)} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} autoFocus>
              <option value="" disabled>
                {t.dialogs.editCategory.chooseCategory}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category} / {c.subcategory}
                </option>
              ))}
            </Select>
            <Input placeholder={t.dialogs.editCategory.reasonPlaceholder} value={reason} onChange={(e) => setReason(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? t.common.saving : t.common.save}
              </Button>
            </div>
      </form>
    </ExpenseDialog>
  );
}
