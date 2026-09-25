import * as React from "react";
import { AlertTriangle, CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError, type Category, type RecurrentExpense } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { apiDate, localDate } from "@/lib/recurrent";
import { useT } from "@/lib/language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
function RecurrentForm({
  existing,
  categories,
  takenCategoryIds,
  onClose,
  onSaved,
}: {
  existing: RecurrentExpense | null;
  categories: Category[];
  takenCategoryIds: Set<number>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const m = t.recurrent.manage;
  const [categoryId, setCategoryId] = React.useState(existing ? String(existing.category_id) : "");
  const [name, setName] = React.useState(existing?.name ?? "");
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

function RecurrentRow({
  item,
  onEdit,
  onChanged,
}: {
  item: RecurrentExpense;
  onEdit: () => void;
  onChanged: () => Promise<void>;
}) {
  const t = useT();
  const m = t.recurrent.manage;
  const [saving, setSaving] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const dateLabel = (value: string) => {
    const d = localDate(value);
    return `${d.getDate()} ${t.months.short[d.getMonth()]} ${d.getFullYear()}`;
  };

  async function toggleActive() {
    setSaving(true);
    setError(null);
    try {
      await api.recurrent.update(item.id, {
        name: item.name,
        day_of_month: item.day_of_month,
        start_date: item.start_date ? apiDate(item.start_date) : null,
        end_date: item.end_date ? apiDate(item.end_date) : null,
        active: !item.active,
      });
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, m.failedToSave));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError(null);
    try {
      await api.recurrent.delete(item.id);
      setConfirmingDelete(false);
      await onChanged();
    } catch (err) {
      // 409 once it has paid history -- the API's message says to deactivate.
      setConfirmingDelete(false);
      setError(errorMessage(err, m.failedToDelete));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex flex-wrap items-baseline gap-x-2 font-medium">
            {item.name}
            {!item.active && <span className="text-xs font-normal text-muted-foreground">{m.inactive}</span>}
          </span>
          <span className="text-xs text-muted-foreground">
            {item.category_name} · {m.everyMonthOn(item.day_of_month)}
            {item.start_date && m.from(dateLabel(item.start_date))}
            {item.end_date && m.until(dateLabel(item.end_date))}
          </span>
        </div>
        <span className="text-sm font-medium tabular-nums">
          {item.amount != null ? (
            formatMoney(item.amount, item.currency)
          ) : (
            <span className="flex items-center gap-1 text-xs font-normal text-warning" title={m.noBudget}>
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              {t.recurrent.noBudget}
            </span>
          )}
        </span>
        <div className="ml-12 flex items-center gap-1 sm:ml-0">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} disabled={saving} aria-label={m.edit}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setConfirmingDelete(true)}
            disabled={saving}
            aria-label={m.delete}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button size="sm" variant="outline" onClick={toggleActive} disabled={saving}>
            {item.active ? m.deactivate : m.activate}
          </Button>
        </div>
      </div>
      {error && <p className="pl-12 text-xs text-destructive">{error}</p>}

      {confirmingDelete && (
        <ExpenseDialog
          title={m.deleteTitle(item.name)}
          description={<p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.deleteHelp}</p>}
          onClose={() => setConfirmingDelete(false)}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirmingDelete(false)} disabled={saving}>
              {t.common.cancel}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? t.common.deleting : t.common.delete}
            </Button>
          </div>
        </ExpenseDialog>
      )}
    </div>
  );
}

// Grace period before a pending payment shows as overdue -- the one
// setting this feature has, kept next to the recurrences it applies to
// rather than in Advanced.
function GraceDaysCard() {
  const t = useT();
  const m = t.recurrent.manage;
  const [value, setValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.settings
      .get()
      .then((s) => setValue(String(s.recurrent_grace_days)))
      .catch((err) => setError(errorMessage(err, t.settings.failedToLoad)));
  }, []);

  async function handleSave() {
    const n = Number(value);
    if (value.trim() === "" || !Number.isInteger(n) || n < 0 || n > 28) {
      setError(m.graceDaysInvalid);
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.settings.update({ recurrent_grace_days: n });
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, t.settings.failedToSave));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.graceDays}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <p className="text-xs leading-relaxed text-muted-foreground">{m.graceDaysHelp}</p>
        <div className="flex items-center gap-3">
          <Input
            aria-label={m.graceDays}
            type="number"
            inputMode="numeric"
            min={0}
            max={28}
            value={value}
            onChange={(e) => {
              setSaved(false);
              setValue(e.target.value);
            }}
            className="w-24"
            disabled={saving}
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t.common.saving : t.common.save}
          </Button>
          {saved && <span className="text-sm text-muted-foreground">{t.common.saved}</span>}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

export default function Recurring() {
  const t = useT();
  const m = t.recurrent.manage;
  const [items, setItems] = React.useState<RecurrentExpense[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  // null = closed, "new" = add form, otherwise the recurrence being edited.
  const [formTarget, setFormTarget] = React.useState<RecurrentExpense | "new" | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [recurrent, cats] = await Promise.all([api.recurrent.list(), api.categories.list()]);
      setItems(recurrent);
      setCategories(cats);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, m.failedToLoad));
    }
  }, []);

  React.useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const takenCategoryIds = React.useMemo(() => new Set(items.map((i) => i.category_id)), [items]);

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <p className="text-sm leading-relaxed text-muted-foreground">{m.intro}</p>
          <Button size="sm" className="shrink-0" onClick={() => setFormTarget("new")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{m.add}</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{m.none}</p>
          ) : (
            items.map((item) => (
              <RecurrentRow key={item.id} item={item} onEdit={() => setFormTarget(item)} onChanged={load} />
            ))
          )}
        </CardContent>
      </Card>

      <GraceDaysCard />

      {formTarget && (
        <RecurrentForm
          existing={formTarget === "new" ? null : formTarget}
          categories={categories}
          takenCategoryIds={takenCategoryIds}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
