import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, CalendarClock, Check, CircleCheck, Link2, SkipForward, Undo2, Wallet, X } from "lucide-react";
import { api, type RecurrentDue } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";
import { formatMoney } from "@/lib/format";
import { localDate, payUrl, periodKey } from "@/lib/recurrent";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { LinkRecurrentDialog } from "@/components/recurrent/LinkRecurrentDialog";

// Loads GET /recurrent-expenses/due and keeps it fresh: one card per active
// recurrence (its next unresolved month). Lifted out of the list itself so
// the Review page can show the tab's count before the tab is opened.
// `configured` is whether the user has any recurrences at all, to tell
// "nothing due" apart from "nothing set up".
export function useRecurrentDue() {
  const [items, setItems] = React.useState<RecurrentDue[]>([]);
  const [configured, setConfigured] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [due, all] = await Promise.all([api.recurrent.due(), api.recurrent.list()]);
      setItems(due);
      setConfigured(all.some((r) => r.active));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // A new expense can be auto-matched by the database trigger, turning a
  // pending card into "looks paid" -- refetch like the expense queue does.
  useExpenseEvents(load);

  // Overdue and matched are the ones asking for the user's attention.
  const attentionCount = items.filter((i) => i.status !== "pending").length;
  return { items, configured, loading, error, reload: load, attentionCount };
}

const STATUS_STYLES = {
  overdue: { icon: AlertTriangle, tile: "bg-destructive-soft text-destructive", text: "text-destructive" },
  matched: { icon: CircleCheck, tile: "bg-warning-soft text-warning", text: "text-warning" },
  pending: { icon: CalendarClock, tile: "bg-secondary text-secondary-foreground", text: "text-muted-foreground" },
} as const;

function RecurrentCard({
  due,
  busy,
  onConfirm,
  onReject,
  onLink,
  onSkip,
  onUndo,
}: {
  due: RecurrentDue;
  busy: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onLink: () => void;
  onSkip: () => void;
  onUndo: () => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const style = STATUS_STYLES[due.status];
  const Icon = style.icon;
  const dueDate = localDate(due.due_date);
  const dayLabel = (d: Date) => `${d.getDate()} ${t.months.short[d.getMonth()]}`;
  const dueDay = dayLabel(dueDate);
  const expenseDay = due.expense_date ? dayLabel(localDate(due.expense_date)) : "";
  const previousMonth = due.previous_period ? t.months.full[localDate(due.previous_period).getMonth()] : "";

  // A matched card is waiting on a confirmation, not on a payment -- how
  // late the due date is doesn't mean anything there.
  let dueText: string;
  if (due.status === "matched") dueText = t.recurrent.dueOn(dueDay);
  else if (due.days_until_due < 0) dueText = `${t.recurrent.dueOn(dueDay)} · ${t.recurrent.overdueBy(-due.days_until_due)}`;
  else if (due.days_until_due === 0) dueText = t.recurrent.dueToday;
  else dueText = `${t.recurrent.dueOn(dueDay)} · ${t.recurrent.dueIn(due.days_until_due)}`;

  return (
    <Card className={cn(due.status === "overdue" && "border-destructive/40")}>
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-start gap-3">
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", style.tile)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate font-medium">{due.name}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {due.amount != null ? formatMoney(due.amount, due.currency) : ""}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
              <span className="truncate">{due.category_name}</span>
              {due.amount == null && <span className="shrink-0">{t.recurrent.noBudget}</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className={cn("font-medium", style.text)}>{t.recurrent.status[due.status]}</span>
              <span className="text-muted-foreground">· {dueText}</span>
            </div>
          </div>
        </div>

        {due.status === "matched" && due.expense_id != null && (
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm sm:ml-[3.25rem]">
            <p className="text-muted-foreground">{t.recurrent.matchedQuestion(due.name)}</p>
            <p className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 font-medium">
              <span className="truncate">{due.expense_merchant ?? t.recurrent.unknownMerchant}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {expenseDay} · {formatMoney(due.expense_amount, due.expense_currency)}
              </span>
            </p>
          </div>
        )}

        {/* The month before, already resolved: why the card sits under a
            later month, and where that can be taken back. */}
        {due.previous_status && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 py-1.5 pl-3 pr-1.5 text-xs sm:ml-[3.25rem]">
            <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              {due.previous_status === "paid" ? (
                <CircleCheck className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <SkipForward className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="font-medium text-foreground">
                {due.previous_status === "paid" ? t.recurrent.previousPaid(previousMonth) : t.recurrent.previousSkipped(previousMonth)}
              </span>
              {due.previous_status === "paid" && due.previous_expense_id != null && (
                <span className="truncate">
                  · {due.previous_expense_merchant ?? t.recurrent.unknownMerchant}
                  {due.previous_expense_date ? `, ${dayLabel(localDate(due.previous_expense_date))}` : ""}
                  {" · "}
                  {formatMoney(due.previous_expense_amount, due.previous_expense_currency)}
                </span>
              )}
            </span>
            <Button size="sm" variant="ghost" className="h-7 shrink-0 px-2" onClick={onUndo} disabled={busy}>
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t.recurrent.undo}
            </Button>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          {due.status === "matched" ? (
            <>
              <Button size="sm" variant="ghost" onClick={onLink} disabled={busy}>
                <Link2 className="h-4 w-4" aria-hidden="true" />
                {t.recurrent.pickAnother}
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} disabled={busy}>
                <X className="h-4 w-4" aria-hidden="true" />
                {t.recurrent.reject}
              </Button>
              <Button size="sm" onClick={onConfirm} disabled={busy}>
                <Check className="h-4 w-4" aria-hidden="true" />
                {t.recurrent.confirm}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={onSkip} disabled={busy}>
                <SkipForward className="h-4 w-4" aria-hidden="true" />
                {t.recurrent.skip}
              </Button>
              <Button size="sm" variant="outline" onClick={onLink} disabled={busy}>
                <Link2 className="h-4 w-4" aria-hidden="true" />
                {t.recurrent.linkExpense}
              </Button>
              <Button size="sm" onClick={() => navigate(payUrl(due))} disabled={busy}>
                <Wallet className="h-4 w-4" aria-hidden="true" />
                {t.recurrent.markPaid}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// The Review page's "Recurring" section: what's coming due, grouped by
// month (the API sorts by period first, then overdue, looks-paid,
// upcoming). Once a month is paid a card moves on to the next month's
// group, so the heading is what tells the user which month its actions are
// for.
export function RecurrentDueList({
  state,
  onMessage,
}: {
  state: ReturnType<typeof useRecurrentDue>;
  onMessage: (message: string) => void;
}) {
  const t = useT();
  const { items, configured, loading, error, reload } = state;
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [linkTarget, setLinkTarget] = React.useState<RecurrentDue | null>(null);
  const [skipTarget, setSkipTarget] = React.useState<RecurrentDue | null>(null);
  const [undoTarget, setUndoTarget] = React.useState<RecurrentDue | null>(null);

  async function run(due: RecurrentDue, action: () => Promise<unknown>, message: string) {
    setBusyId(due.recurrent_expense_id);
    setActionError(null);
    try {
      await action();
      await reload();
      onMessage(message);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.recurrent.actionFailed);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  if (error != null) return <p className="text-sm text-destructive">{error || t.recurrent.failedToLoad}</p>;

  const skipPeriod = skipTarget ? localDate(skipTarget.period) : null;
  const monthLabel = (value: string) => {
    const d = localDate(value);
    return t.recurrent.periodLabel(t.months.full[d.getMonth()], d.getFullYear());
  };

  // Consecutive runs of the same period, in the API's order.
  const groups: { period: string; items: RecurrentDue[] }[] = [];
  for (const due of items) {
    const key = periodKey(due.period);
    const last = groups[groups.length - 1];
    if (last && last.period === key) last.items.push(due);
    else groups.push({ period: key, items: [due] });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t.recurrent.subtitle}</p>
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-2 pt-4 text-sm text-muted-foreground">
            {configured ? (
              t.recurrent.allCaughtUp
            ) : (
              <>
                <span>{t.recurrent.noneSetUp}</span>
                <Link to="/settings/recurring" className="font-medium text-primary underline-offset-4 hover:underline">
                  {t.recurrent.setUp}
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <section key={group.period} className="flex flex-col gap-2" aria-label={monthLabel(group.items[0].period)}>
            <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {monthLabel(group.items[0].period)}
            </h2>
            {group.items.map((due) => (
              <RecurrentCard
                key={due.recurrent_expense_id}
                due={due}
                busy={busyId === due.recurrent_expense_id}
                onConfirm={() =>
                  run(due, () => api.recurrent.confirm(due.recurrent_expense_id, periodKey(due.period)), t.recurrent.confirmed(due.name))
                }
                onReject={() =>
                  run(due, () => api.recurrent.reject(due.recurrent_expense_id, periodKey(due.period)), t.recurrent.rejected(due.name))
                }
                onLink={() => setLinkTarget(due)}
                onSkip={() => setSkipTarget(due)}
                onUndo={() => setUndoTarget(due)}
              />
            ))}
          </section>
        ))
      )}

      {undoTarget?.previous_period && (
        <ExpenseDialog
          title={t.recurrent.undoTitle(undoTarget.name, monthLabel(undoTarget.previous_period))}
          description={
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {undoTarget.previous_status === "paid" ? t.recurrent.undoPaidHelp : t.recurrent.undoSkippedHelp}
            </p>
          }
          onClose={() => setUndoTarget(null)}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setUndoTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const target = undoTarget;
                const previous = target.previous_period!;
                setUndoTarget(null);
                run(
                  target,
                  () => api.recurrent.undo(target.recurrent_expense_id, periodKey(previous)),
                  t.recurrent.undone(target.name, monthLabel(previous)),
                );
              }}
            >
              {t.recurrent.undo}
            </Button>
          </div>
        </ExpenseDialog>
      )}

      {linkTarget && (
        <LinkRecurrentDialog
          due={linkTarget}
          onClose={() => setLinkTarget(null)}
          onLinked={() => {
            const name = linkTarget.name;
            setLinkTarget(null);
            reload();
            onMessage(t.recurrent.linked(name));
          }}
        />
      )}

      {skipTarget && skipPeriod && (
        <ExpenseDialog
          title={t.recurrent.skipTitle(
            skipTarget.name,
            t.recurrent.periodLabel(t.months.full[skipPeriod.getMonth()], skipPeriod.getFullYear()),
          )}
          description={<p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.recurrent.skipHelp}</p>}
          onClose={() => setSkipTarget(null)}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setSkipTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const target = skipTarget;
                setSkipTarget(null);
                run(target, () => api.recurrent.skip(target.recurrent_expense_id, periodKey(target.period)), t.recurrent.skipped(target.name));
              }}
            >
              {t.recurrent.skipConfirm}
            </Button>
          </div>
        </ExpenseDialog>
      )}
    </div>
  );
}
