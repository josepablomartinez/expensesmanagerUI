import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { api, ApiError, type Category, type RecurrentExpense } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { apiDate } from "@/lib/recurrent";
import { useT } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
}

// Add/edit form in a dialog. The subcategory is only chosen on create --
// the API doesn't let a recurrence move to another subcategory (its history
// is tied to that subcategory's expenses), so editing shows it read-only.
export function RecurrentForm({
  existing,
  initialCategoryId,
  categories,
  takenCategoryIds,
  onClose,
  onSaved,
}: {
  existing: RecurrentExpense | null;
  // Preselects the subcategory for a new recurrence (the Categories page's
  // per-subcategory recurring icon); ignored when editing.
  initialCategoryId?: number;
  categories: Category[];
  takenCategoryIds: Set<number>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const m = t.recurrent.manage;
  const initialCategory = existing ? undefined : categories.find((c) => c.id === initialCategoryId);
  const [categoryId, setCategoryId] = React.useState(
    existing ? String(existing.category_id) : initialCategory ? String(initialCategory.id) : "",
  );
  const [name, setName] = React.useState(existing?.name ?? initialCategory?.subcategory ?? "");
  const [day, setDay] = React.useState(existing ? String(existing.day_of_month) : "");
  const [startDate, setStartDate] = React.useState(existing?.start_date ? apiDate(existing.start_date) : "");
  const [endDate, setEndDate] = React.useState(existing?.end_date ? apiDate(existing.end_date) : "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedCategory = categories.find((c) => String(c.id) === categoryId);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const dayNum = Number(day);
    if (!existing && !categoryId) return setError(m.subcategoryRequired);
    if (!name.trim()) return setError(m.nameRequired);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 31) return setError(m.dayInvalid);
    if (startDate && endDate && endDate < startDate) return setError(m.endBeforeStart);

    const body = {
      name: name.trim(),
      day_of_month: dayNum,
      start_date: startDate || null,
      end_date: endDate || null,
    };
    setSaving(true);
    setError(null);
    try {
      if (existing) await api.recurrent.update(existing.id, { ...body, active: existing.active });
      else await api.recurrent.create({ ...body, category_id: Number(categoryId) });
      onSaved();
    } catch (err) {
      setError(errorMessage(err, m.failedToSave));
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog title={existing ? `${m.edit} · ${existing.name}` : m.add} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="recurrent-category" className="text-sm font-medium">
            {m.subcategory}
          </label>
          {existing ? (
            <p className="text-sm text-muted-foreground">{existing.category_name}</p>
          ) : (
            <Select
              id="recurrent-category"
              value={categoryId}
              disabled={saving}
              onChange={(e) => {
                setCategoryId(e.target.value);
                // Default the name to the subcategory's until the user types one.
                const picked = categories.find((c) => String(c.id) === e.target.value);
                if (picked && !name.trim()) setName(picked.subcategory);
              }}
            >
              <option value="" disabled>
                {m.chooseSubcategory}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} disabled={takenCategoryIds.has(c.id)}>
                  {c.category} / {c.subcategory}
                  {takenCategoryIds.has(c.id) ? ` ${m.alreadyRecurring}` : ""}
                </option>
              ))}
            </Select>
          )}
          {!existing && selectedCategory && (
            selectedCategory.budget != null ? (
              <p className="text-xs text-muted-foreground">
                {t.recurrent.expected(formatMoney(selectedCategory.budget, selectedCategory.budget_currency))}
              </p>
            ) : (
              <p className="flex items-start gap-1.5 text-xs text-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {m.noBudget}
              </p>
            )
          )}
        </div>

        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recurrent-name" className="text-sm font-medium">
              {m.name}
            </label>
            <Input
              id="recurrent-name"
              value={name}
              maxLength={50}
              placeholder={m.namePlaceholder}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recurrent-day" className="text-sm font-medium">
              {m.dayOfMonth}
            </label>
            <Input
              id="recurrent-day"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              value={day}
              placeholder="1-31"
              onChange={(e) => setDay(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">{m.dayHelp}</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recurrent-start" className="text-sm font-medium">
              {m.startDate} <span className="font-normal text-muted-foreground">({m.optional})</span>
            </label>
            <Input id="recurrent-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={saving} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recurrent-end" className="text-sm font-medium">
              {m.endDate} <span className="font-normal text-muted-foreground">({m.optional})</span>
            </label>
            <Input id="recurrent-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={saving} />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t.common.saving : t.common.save}
          </Button>
        </div>
      </form>
    </ExpenseDialog>
  );
}

