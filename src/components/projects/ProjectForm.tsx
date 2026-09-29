import * as React from "react";
import { api, ApiError, type Project, type ProjectStatus } from "@/lib/api";
import { apiDate } from "@/lib/recurrent";
import { useCurrency } from "@/lib/currency";
import { useT } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
}

const STATUSES: ProjectStatus[] = ["active", "inactive", "canceled"];

// Add/edit form in a dialog, opened from the Projects page and from the
// expense edit dialog's project picker ("+ New project…"). A new project
// always starts active, so status (and the canceled-only "count as regular"
// switch) only appear when editing.
export function ProjectForm({
  existing,
  onClose,
  onSaved,
}: {
  existing: Project | null;
  onClose: () => void;
  onSaved: (project: Project) => void;
}) {
  const t = useT();
  const p = t.projects;
  const { currency: displayCurrency } = useCurrency();
  const [name, setName] = React.useState(existing?.name ?? "");
  const [startDate, setStartDate] = React.useState(existing?.start_date ? apiDate(existing.start_date) : "");
  const [endDate, setEndDate] = React.useState(existing?.end_date ? apiDate(existing.end_date) : "");
  const [budget, setBudget] = React.useState(existing?.budget != null ? String(existing.budget) : "");
  const [budgetCurrency, setBudgetCurrency] = React.useState<"CRC" | "USD">(
    existing?.budget_currency ?? (displayCurrency === "USD" ? "USD" : "CRC"),
  );
  const [notes, setNotes] = React.useState(existing?.notes ?? "");
  const [status, setStatus] = React.useState<ProjectStatus>(existing?.status ?? "active");
  const [countsAsRegular, setCountsAsRegular] = React.useState(existing?.canceled_counts_as_regular ?? true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError(p.nameRequired);
    if (startDate && endDate && endDate < startDate) return setError(p.endBeforeStart);
    const budgetNum = budget.trim() === "" ? null : Number(budget);
    if (budgetNum !== null && (!Number.isFinite(budgetNum) || budgetNum <= 0)) return setError(p.budgetInvalid);

    const body = {
      name: name.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      budget: budgetNum,
      budget_currency: budgetCurrency,
      notes: notes.trim() || null,
    };
    setSaving(true);
    setError(null);
    try {
      const saved = existing
        ? await api.projects.update(existing.id, { ...body, status, canceled_counts_as_regular: countsAsRegular })
        : await api.projects.create(body);
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err, p.failedToSave));
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog title={existing ? p.editTitle(existing.name) : p.newTitle} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-name" className="text-sm font-medium">
            {p.name}
          </label>
          <Input
            id="project-name"
            value={name}
            maxLength={80}
            placeholder={p.namePlaceholder}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-start" className="text-sm font-medium">
              {p.startDate} <span className="font-normal text-muted-foreground">({p.optional})</span>
            </label>
            <Input id="project-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={saving} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-end" className="text-sm font-medium">
              {p.endDate} <span className="font-normal text-muted-foreground">({p.optional})</span>
            </label>
            <Input id="project-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={saving} />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-budget" className="text-sm font-medium">
              {p.budget} <span className="font-normal text-muted-foreground">({p.optional})</span>
            </label>
            <Input
              id="project-budget"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-currency" className="text-sm font-medium">
              {p.currency}
            </label>
            <Select
              id="project-currency"
              value={budgetCurrency}
              onChange={(e) => setBudgetCurrency(e.target.value as "CRC" | "USD")}
              disabled={saving}
            >
              <option value="CRC">CRC</option>
              <option value="USD">USD</option>
            </Select>
          </div>
        </div>

        {existing && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-status" className="text-sm font-medium">
              {p.statusLabel}
            </label>
            <Select
              id="project-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              disabled={saving}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {p.status[s]}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">{p.statusHelp}</p>
          </div>
        )}

        {existing && status === "canceled" && (
          <div className="flex items-start justify-between gap-3 rounded-panel border border-border p-3">
            <div className="flex flex-col gap-1">
              <span id="project-regular-label" className="text-sm font-medium">
                {p.canceledCountsAsRegular}
              </span>
              <span className="text-xs text-muted-foreground">{p.canceledHelp}</span>
            </div>
            <Switch
              checked={countsAsRegular}
              onCheckedChange={setCountsAsRegular}
              disabled={saving}
              aria-labelledby="project-regular-label"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-notes" className="text-sm font-medium">
            {p.notes} <span className="font-normal text-muted-foreground">({p.optional})</span>
          </label>
          <Textarea id="project-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={saving} />
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
