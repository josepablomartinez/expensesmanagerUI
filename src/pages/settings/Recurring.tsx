import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError, type Category, type RecurrentExpense } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { apiDate, localDate } from "@/lib/recurrent";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { RecurrentForm } from "@/components/recurrent/RecurrentForm";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
}

function RecurrentRow({
  item,
  focused,
  onEdit,
  onChanged,
}: {
  item: RecurrentExpense;
  onEdit: () => void;
  onChanged: () => Promise<void>;
  // Arrived here from its subcategory's recurring icon in Categories.
  focused: boolean;
}) {
  const t = useT();
  const m = t.recurrent.manage;
  const rowRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (focused) rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focused]);
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
    <div
      ref={rowRef}
      className={cn(
        "flex flex-col gap-2 border-t border-border py-3 first:border-t-0",
        focused && "-mx-3 rounded-lg border-transparent bg-secondary/50 px-3 ring-2 ring-primary",
      )}
    >
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
  const [searchParams] = useSearchParams();
  const focusId = Number(searchParams.get("focus")) || null;
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
              <RecurrentRow
                key={item.id}
                item={item}
                focused={item.id === focusId}
                onEdit={() => setFormTarget(item)}
                onChanged={load}
              />
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
