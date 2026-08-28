import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
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

export default function Review() {
  const { currency } = useCurrency();
  const t = useT();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focus");

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
      await api.expenses.bulkApprove(ids);
      const idSet = new Set(ids);
      setExpenses((prev) => prev.filter((e) => !idSet.has(e.id)));
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setSuccessMessage(t.review.approvedCount(ids.length));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t.review.failedToApprove);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  const focusedExpenseMissing = focusId != null && !expenses.some((e) => String(e.id) === focusId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.review.queueTitle}</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{t.review.pendingCount(expenses.length)}</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => approveIds([...selected])}
            disabled={selected.size === 0}
          >
            {t.review.approveSelected(selected.size)}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => approveIds(expenses.map((e) => e.id))}
            disabled={expenses.length === 0}
          >
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
              <CardContent className="flex items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
                    checked={selected.has(expense.id)}
                    onChange={() => toggleSelected(expense.id)}
                    aria-label={t.review.selectExpense(expense.merchant ?? expense.entity)}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{expense.merchant ?? expense.entity}</span>
                    <span className="text-xs text-muted-foreground">
                      {expense.date.slice(0, 10)} · {formatExpenseAmount(expense, currency)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expense.flag_type && (
                    <Badge variant="destructive" title={expense.flag_reason ?? undefined}>
                      {t.common.possibleDuplicate}
                    </Badge>
                  )}
                  {expense.confidence != null && (
                    <Badge variant="outline">{t.common.confidencePercent(Math.round(expense.confidence * 100))}</Badge>
                  )}
                  <Select
                    value={selections[expense.id] ?? ""}
                    onChange={(e) =>
                      setSelections((prev) => ({ ...prev, [expense.id]: e.target.value }))
                    }
                  >
                    <option value="" disabled>
                      {t.review.chooseCategory}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category} / {c.subcategory}
                      </option>
                    ))}
                  </Select>
                  <label
                    className={cn(
                      "flex items-center gap-1.5 text-xs text-muted-foreground",
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
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label={t.review.approve}
                    disabled={!selections[expense.id]}
                    onClick={() => confirmApprove(expense)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {successMessage && <InfoModal message={successMessage} onClose={() => setSuccessMessage(null)} />}
    </div>
  );
}
