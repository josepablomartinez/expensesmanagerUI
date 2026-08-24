import * as React from "react";
import { api, type Category, type Expense } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Props {
  expense: Expense;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

export function EditCategoryDialog({ expense, categories, onClose, onSave }: Props) {
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
      setError("Choose a category");
      return;
    }

    setSaving(true);
    try {
      await api.expenses.update(expense.id, { categoryId: Number(categoryId), reason });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            Edit category for "{expense.merchant ?? expense.entity}"
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} autoFocus>
              <option value="" disabled>
                Choose category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category} / {c.subcategory}
                </option>
              ))}
            </Select>
            <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
