import * as React from "react";
import { api, ApiError, type RecurrentCandidate, type RecurrentDue } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { apiDate, localDate, periodKey } from "@/lib/recurrent";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// "Link expense" / "Pick another" on a recurring card: lists the
// subcategory's expenses around the period (GET .../candidates) and links
// the one the user picks as paid. Covers what the automatic match can't:
// a payment that landed on the wrong month (paid on the 28th for a loan due
// on the 1st while that month was still open), a wrong match that was
// rejected, or an expense still waiting in the review queue.
export function LinkRecurrentDialog({
  due,
  onClose,
  onLinked,
}: {
  due: RecurrentDue;
  onClose: () => void;
  onLinked: () => void;
}) {
  const t = useT();
  const period = periodKey(due.period);
  const [candidates, setCandidates] = React.useState<RecurrentCandidate[] | null>(null);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const monthLabel = (value: string) => {
    const d = localDate(value);
    return t.recurrent.periodLabel(t.months.full[d.getMonth()], d.getFullYear());
  };
  const dayLabel = (value: string) => {
    const d = localDate(value);
    return `${d.getDate()} ${t.months.short[d.getMonth()]}`;
  };

  React.useEffect(() => {
    api.recurrent
      .candidates(due.recurrent_expense_id, period)
      .then((rows) => {
        setCandidates(rows);
        // Preselect the only sensible choice when there is one.
        const linkable = rows.filter((c) => c.linked_status !== "paid" && c.expense_id !== due.expense_id);
        if (linkable.length === 1) setSelected(linkable[0].expense_id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t.recurrent.failedToLoad));
  }, [due.recurrent_expense_id, due.expense_id, period]);

  async function handleLink() {
    if (selected == null) return;
    setSaving(true);
    setError(null);
    try {
      await api.recurrent.link(due.recurrent_expense_id, period, selected);
      onLinked();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : t.recurrent.actionFailed);
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog
      title={t.recurrent.link.title(due.name)}
      description={
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t.recurrent.link.help(monthLabel(due.period))}
        </p>
      }
      onClose={onClose}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4">
        {candidates == null && !error && <p className="text-sm text-muted-foreground">{t.common.loading}</p>}
        {candidates != null && candidates.length === 0 && (
          <p className="text-sm text-muted-foreground">{t.recurrent.link.none}</p>
        )}
        {candidates != null && candidates.length > 0 && (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="sr-only">{t.recurrent.link.title(due.name)}</legend>
            {candidates.map((c) => {
              const paidElsewhere = c.linked_status === "paid";
              // Already this card's own match -- linking it again is a no-op.
              const current = c.expense_id === due.expense_id;
              const disabled = paidElsewhere || current;
              return (
                <label
                  key={c.expense_id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors",
                    selected === c.expense_id ? "border-primary bg-secondary/60" : "hover:bg-accent",
                    disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                  )}
                >
                  <input
                    type="radio"
                    name="recurrent-link-candidate"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={selected === c.expense_id}
                    disabled={disabled || saving}
                    onChange={() => setSelected(c.expense_id)}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium">
                        {c.merchant ?? t.recurrent.unknownMerchant}
                      </span>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {formatMoney(c.amount, c.currency)}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{dayLabel(apiDate(c.date_event))}</span>
                      {!c.reviewed && <Badge variant="outline">{t.recurrent.link.unreviewed}</Badge>}
                      {paidElsewhere && c.linked_period && (
                        <span>· {t.recurrent.link.alreadyPaid(monthLabel(c.linked_period))}</span>
                      )}
                      {c.linked_status === "matched" && c.linked_period && !current && (
                        <span className="text-warning">· {t.recurrent.link.matchedTo(monthLabel(c.linked_period))}</span>
                      )}
                    </span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="button" onClick={handleLink} disabled={selected == null || saving}>
            {saving ? t.recurrent.link.linking : t.recurrent.link.link}
          </Button>
        </div>
      </div>
    </ExpenseDialog>
  );
}
