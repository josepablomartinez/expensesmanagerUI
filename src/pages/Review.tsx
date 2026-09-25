import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarClock, Check, Coins, Inbox, ListChecks, MessageSquareText, Split } from "lucide-react";
import { api, type Category, type Expense } from "@/lib/api";
import { useExpenseEvents } from "@/lib/events";
import { formatExpenseAmount } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InfoModal } from "@/components/InfoModal";
import { ExpenseFlag } from "@/components/expenses/ExpenseFlag";
import { BulkReviewDialog } from "@/components/BulkReviewDialog";
import { SplitExpenseDialog } from "@/components/SplitExpenseDialog";
import { resolveCategoryOverrides, resolveMerchantRules } from "@/lib/reviewApprove";
import { RecurrentDueList, useRecurrentDue } from "@/components/recurrent/RecurrentDueList";

type ReviewTab = "expenses" | "recurring";

export default function Review() {
  const { currency } = useCurrency();
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get("focus");
  // Kept in the URL so "mark as paid" can come back to this tab, and a
  // deep link (?focus=) always lands on the expenses tab it points into.
  const tab: ReviewTab = searchParams.get("tab") === "recurring" && !focusId ? "recurring" : "expenses";
  const recurrent = useRecurrentDue();

  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  // Category picked per row, kept local until the user hits the checkmark --
  // picking a category no longer submits anything by itself.
  const [selections, setSelections] = React.useState<Record<number, string>>({});
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  // "Always categorize this merchant as X" per row, opt-in via its own checkbox.
  const [alwaysCategorize, setAlwaysCategorize] = React.useState<Record<number, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [bulkReviewOpen, setBulkReviewOpen] = React.useState(false);
  const [splitTarget, setSplitTarget] = React.useState<Expense | null>(null);

  const rowRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const hasScrolledToFocus = React.useRef(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // No confidence cutoff -- this is "every unreviewed expense", so a
      // deep link from the Unreviewed badge in Search always finds its item
      // here regardless of how confident the auto-categorization was.
      const [reviewRows, categoryRows] = await Promise.all([api.expenses.review(), api.categories.list()]);
      setExpenses(reviewRows);
      setCategories(categoryRows);
      setSelections((prev) => {
        const next = { ...prev };
        for (const e of reviewRows) {
          if (!(e.id in next)) next[e.id] = e.category_id ? String(e.category_id) : "";
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.review.failedToLoad);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Reload the queue whenever the inbox agent (or anything else) inserts a
  // new expense, instead of the user having to refresh to see it. A refetch
  // is cheap here and keeps min_confidence filtering in one place (the SQL
  // function) rather than duplicating it client-side.
  useExpenseEvents(load);

  React.useEffect(() => {
    if (!focusId || hasScrolledToFocus.current || loading) return;
    const el = rowRefs.current[Number(focusId)];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      hasScrolledToFocus.current = true;
    }
  }, [focusId, loading, expenses]);

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmApprove(expense: Expense) {
    const categoryId = Number(selections[expense.id]);
    if (!categoryId) return;
    setActionError(null);
    try {
      await api.expenses.updateCategory(expense.id, categoryId);
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(expense.id);
        return next;
      });

      let ruleWarning = "";
      if (alwaysCategorize[expense.id] && expense.merchant) {
        try {
          await api.merchantRules.create({ commercePattern: expense.merchant, categoryId });
        } catch (err) {
          // The approval already succeeded -- don't lose that just because
          // the rule failed to save, but surface it separately.
          ruleWarning = t.review.merchantRuleNotSaved(err instanceof Error ? err.message : t.review.unknownError);
        }
      }
      setAlwaysCategorize((prev) => {
        const next = { ...prev };
        delete next[expense.id];
        return next;
      });

      setSuccessMessage(t.review.approved(expense.merchant ?? expense.entity) + ruleWarning);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.review.failedToApprove);
    }
  }

  async function approveIds(ids: number[]) {
    if (ids.length === 0) return;
    setActionError(null);
    try {
      const overrides = resolveCategoryOverrides(expenses, ids, selections);
      await Promise.all(overrides.map((o) => api.expenses.updateCategory(o.id, o.categoryId)));
      await api.expenses.bulkApprove(ids);

      const ruleRequests = resolveMerchantRules(expenses, ids, selections, alwaysCategorize);
      let ruleFailures = 0;
      if (ruleRequests.length > 0) {
        const results = await Promise.allSettled(
          ruleRequests.map((r) => api.merchantRules.create({ commercePattern: r.commercePattern, categoryId: r.categoryId })),
        );
        ruleFailures = results.filter((r) => r.status === "rejected").length;
      }

      const idSet = new Set(ids);
      setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setAlwaysCategorize((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      setSuccessMessage(
        t.review.approvedCount(ids.length) + (ruleFailures > 0 ? t.review.bulk.rulesNotSaved(ruleFailures) : ""),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.review.failedToApprove);
    }
  }

  const tabs: { id: ReviewTab; label: string; icon: typeof Inbox; count: number | null }[] = [
    { id: "expenses", label: t.review.tabs.expenses, icon: Inbox, count: loading ? null : expenses.length },
    { id: "recurring", label: t.review.tabs.recurring, icon: CalendarClock, count: recurrent.loading ? null : recurrent.attentionCount },
  ];

  const tabBar = (
    <nav
      aria-label={t.review.tabsLabel}
      className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-secondary/40 p-1 sm:max-w-md"
    >
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={tab === item.id ? "page" : undefined}
          onClick={() => setSearchParams(item.id === "recurring" ? { tab: "recurring" } : {})}
          className={cn(
            "flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
            tab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{item.label}</span>
          {item.count != null && item.count > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-medium leading-none text-[#17231f]">
              {item.count > 99 ? "99+" : item.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );

  if (tab === "recurring") {
    return (
      <div className="flex flex-col gap-4">
        {tabBar}
        <h1 className="text-xl font-semibold">{t.recurrent.title}</h1>
        <RecurrentDueList state={recurrent} onMessage={setSuccessMessage} />
        {successMessage && <InfoModal message={successMessage} onClose={() => setSuccessMessage(null)} />}
      </div>
    );
  }

  if (loading) return <div className="flex flex-col gap-4">{tabBar}<p className="text-sm text-muted-foreground">{t.common.loading}</p></div>;
  if (error) return <div className="flex flex-col gap-4">{tabBar}<p className="text-sm text-destructive">{error}</p></div>;

  const focusedExpenseMissing = focusId != null && !expenses.some((e) => String(e.id) === focusId);

  return (
    <div className="flex flex-col gap-4">
      {tabBar}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{t.review.queueTitle}</h1>
          <Badge variant="secondary">{t.review.pendingCount(expenses.length)}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => setBulkReviewOpen(true)}
            disabled={expenses.length === 0}
          >
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            {t.review.bulk.button}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => approveIds([...selected])}
            disabled={selected.size === 0}
          >
            {t.review.approveSelected(selected.size)}
          </Button>
          <Button size="sm" variant="outline" onClick={() => approveIds(expenses.map((e) => e.id))} disabled={expenses.length === 0}>
            {t.review.approveAll}
          </Button>
        </div>
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      {focusedExpenseMissing && (
        <p className="text-sm text-muted-foreground">
          {t.review.focusedExpenseMissing}
        </p>
      )}

      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.review.nothingToReview}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {expenses.map((expense) => (
            <Card
              key={expense.id}
              ref={(el) => {
                rowRefs.current[expense.id] = el;
              }}
              className={cn(String(expense.id) === focusId && "ring-2 ring-primary")}
            >
              <CardContent className="flex flex-col gap-4 pt-4 md:grid md:grid-cols-[minmax(12rem,1fr)_minmax(26rem,1.6fr)] md:items-center">
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                    checked={selected.has(expense.id)}
                    onChange={() => toggleSelected(expense.id)}
                    aria-label={t.review.selectExpense(expense.merchant ?? expense.entity)}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{expense.merchant ?? expense.entity}</span>
                    <span className="text-xs text-muted-foreground">
                      {expense.date.slice(0, 10)} · {formatExpenseAmount(expense, currency)}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <ExpenseFlag expense={expense} className="mt-0" />
                      {expense.confidence != null && (
                        <Badge variant="outline">{t.common.confidencePercent(Math.round(expense.confidence * 100))}</Badge>
                      )}
                    </div>
                    {expense.foreign && (
                      <p
                        className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground"
                        title={expense.foreign.note ?? undefined}
                      >
                        <Coins className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{t.review.foreignCurrency(expense.foreign.original_amount, expense.foreign.original_currency)}</span>
                      </p>
                    )}
                    {expense.motive && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{expense.motive}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_auto_auto_auto] md:items-end">
                  <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
                    {t.review.category}
                    <Select
                      value={selections[expense.id] ?? ""}
                      onChange={(e) => setSelections((prev) => ({ ...prev, [expense.id]: e.target.value }))}
                      className="w-full"
                    >
                      <option value="" disabled>{t.review.chooseCategory}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.category} / {c.subcategory}</option>
                      ))}
                    </Select>
                  </label>
                  <label
                    className={cn(
                      "flex min-h-9 items-center gap-1.5 text-sm text-foreground",
                      !expense.merchant && "opacity-50",
                    )}
                    title={
                      expense.merchant
                        ? t.review.alwaysCategorizeTooltip(expense.merchant)
                        : t.review.noMerchantNameTooltip
                    }
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-primary"
                      checked={alwaysCategorize[expense.id] ?? false}
                      disabled={!expense.merchant}
                      onChange={(e) =>
                        setAlwaysCategorize((prev) => ({ ...prev, [expense.id]: e.target.checked }))
                      }
                      aria-label={t.review.alwaysCategorizeAria(expense.merchant ?? expense.entity)}
                    />
                    {t.review.always}
                  </label>
                  <Button type="button" variant="outline" onClick={() => setSplitTarget(expense)}>
                    <Split className="h-4 w-4" aria-hidden="true" />
                    {t.review.split}
                  </Button>
                  <Button
                    type="button"
                    aria-label={t.review.approve}
                    disabled={!selections[expense.id]}
                    onClick={() => confirmApprove(expense)}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {t.review.approve}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {bulkReviewOpen && (
        <BulkReviewDialog
          expenses={expenses}
          categories={categories}
          onClose={() => setBulkReviewOpen(false)}
          onApproved={(count, ruleFailures) => {
            setBulkReviewOpen(false);
            setSelected(new Set());
            setSuccessMessage(
              t.review.approvedCount(count) + (ruleFailures > 0 ? t.review.bulk.rulesNotSaved(ruleFailures) : ""),
            );
            load();
          }}
        />
      )}

      {splitTarget && (
        <SplitExpenseDialog
          expense={splitTarget}
          categories={categories}
          onClose={() => setSplitTarget(null)}
          onSplit={() => {
            setSplitTarget(null);
            load();
          }}
        />
      )}

      {successMessage && <InfoModal message={successMessage} onClose={() => setSuccessMessage(null)} />}
    </div>
  );
}
