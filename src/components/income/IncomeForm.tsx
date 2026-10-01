import * as React from "react";
import { api, ApiError, type Expense, type Income, type IncomeCategory } from "@/lib/api";
import { apiDate } from "@/lib/recurrent";
import { localISODate } from "@/lib/date";
import { formatMoney } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { useT } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { ExpensePicker, expenseLabel } from "@/components/income/ExpensePicker";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
}

type Currency = "CRC" | "USD";

// What saving a reimbursement will do to the expense, worked out the way the
// API does it. Only possible when the payment is in the expense's own
// currency: otherwise the API compares in colones at the payment date's rate,
// which the UI doesn't have.
function reimbursementPreview(
  expense: Expense,
  amount: number,
  currency: Currency,
  i: ReturnType<typeof useT>["income"],
) {
  if (!Number.isFinite(amount) || amount <= 0 || expense.amount == null) return null;
  if (currency !== expense.currency) return { text: i.previewConverted, tone: "info" as const };
  const paid = Math.round(amount * 100);
  const total = Math.round(expense.amount * 100);
  if (paid > total) return { text: i.previewTooMuch(formatMoney(expense.amount, currency)), tone: "error" as const };
  if (paid === total) return { text: i.previewFull, tone: "info" as const };
  return {
    text: i.previewPartial(formatMoney(amount, currency), formatMoney((total - paid) / 100, currency)),
    tone: "info" as const,
  };
}

// Add/edit an income in a dialog. On create a switch turns it into a
// reimbursement: pick the expense that was paid back and the API takes that
// slice out of the expense reports. presetExpense opens it already in
// reimbursement mode (the "Mark as reimbursed" action on an expense row).
// Editing a reimbursement only allows changing the description.
export function IncomeForm({
  existing,
  presetExpense = null,
  onClose,
  onSaved,
}: {
  existing: Income | null;
  presetExpense?: Expense | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const i = t.income;
  const { currency: displayCurrency } = useCurrency();
  const lockedReimbursement = existing?.linked_expense_id != null;

  const [categories, setCategories] = React.useState<IncomeCategory[]>([]);
  const [reimbursement, setReimbursement] = React.useState(presetExpense != null || lockedReimbursement);
  const [expense, setExpense] = React.useState<Expense | null>(presetExpense);
  const [categoryId, setCategoryId] = React.useState(existing && !lockedReimbursement ? String(existing.income_category_id) : "");
  const [amount, setAmount] = React.useState(
    existing ? String(existing.amount) : presetExpense?.amount != null ? String(presetExpense.amount) : "",
  );
  const [currency, setCurrency] = React.useState<Currency>(
    existing?.currency ?? (presetExpense?.currency === "USD" ? "USD" : presetExpense?.currency === "CRC" ? "CRC" : displayCurrency === "USD" ? "USD" : "CRC"),
  );
  const [date, setDate] = React.useState(existing ? apiDate(existing.date) : localISODate(new Date()));
  const [description, setDescription] = React.useState(existing?.description ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.income
      .categories()
      .then((list) => {
        setCategories(list);
        setCategoryId((current) => current || (list[0] ? String(list[0].id) : ""));
      })
      .catch(() => {});
  }, []);

  function pickExpense(picked: Expense | null) {
    setExpense(picked);
    // Default to paying back the whole thing, in the expense's own currency.
    if (picked && picked.amount != null) {
      setAmount(String(picked.amount));
      if (picked.currency === "USD" || picked.currency === "CRC") setCurrency(picked.currency);
    }
  }

  const amountNum = Number(amount);
  const preview = reimbursement && expense && !lockedReimbursement ? reimbursementPreview(expense, amountNum, currency, i) : null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (lockedReimbursement) {
      setSaving(true);
      try {
        await api.income.update(existing!.id, { description: description.trim() });
        onSaved();
      } catch (err) {
        setError(errorMessage(err, i.failedToSave));
        setSaving(false);
      }
      return;
    }

    if (reimbursement && !expense) return setError(i.expenseRequired);
    if (!reimbursement && !categoryId) return setError(i.categoryRequired);
    if (!Number.isFinite(amountNum) || amountNum <= 0) return setError(i.amountInvalid);
    if (!date) return setError(i.dateRequired);
    // The preview line already says why; no second error line.
    if (preview?.tone === "error") return;

    setSaving(true);
    try {
      if (reimbursement) {
        await api.income.reimburse({
          expense_id: expense!.id,
          amount: amountNum,
          currency,
          date,
          description: description.trim() || null,
        });
      } else if (existing) {
        await api.income.update(existing.id, {
          income_category_id: Number(categoryId),
          amount: amountNum,
          currency,
          date,
          description: description.trim(),
        });
      } else {
        await api.income.create({
          income_category_id: Number(categoryId),
          amount: amountNum,
          currency,
          date,
          description: description.trim() || null,
        });
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err, i.failedToSave));
      setSaving(false);
    }
  }

  const title = lockedReimbursement ? i.editTitle : reimbursement && presetExpense ? i.reimbursementTitle : existing ? i.editTitle : i.newTitle;

  return (
    <ExpenseDialog title={title} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
        {!existing && !presetExpense && (
          <div className="flex items-start justify-between gap-3 rounded-panel border border-border p-3">
            <div className="flex flex-col gap-1">
              <span id="income-reimbursement-label" className="text-sm font-medium">
                {i.reimbursement}
              </span>
              <span className="text-xs text-muted-foreground">{i.reimbursementHelp}</span>
            </div>
            <Switch
              checked={reimbursement}
              onCheckedChange={setReimbursement}
              disabled={saving}
              aria-labelledby="income-reimbursement-label"
            />
          </div>
        )}

        {lockedReimbursement && (
          <div className="flex flex-col gap-1 rounded-panel border border-border p-3">
            <p className="text-sm font-medium">{i.paidBack(existing!.linked_expense_merchant ?? "")}</p>
            <p className="text-xs text-muted-foreground">{i.reimbursementLocked}</p>
          </div>
        )}

        {reimbursement && !lockedReimbursement && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{i.expense}</span>
            {presetExpense ? (
              <div className="rounded-panel border border-border p-3">
                <p className="truncate text-sm font-medium">{expenseLabel(presetExpense)}</p>
                <p className="text-xs text-muted-foreground">
                  {presetExpense.date.slice(0, 10)} · {formatMoney(presetExpense.amount, presetExpense.currency)}
                </p>
              </div>
            ) : (
              <ExpensePicker selected={expense} onSelect={pickExpense} disabled={saving} />
            )}
          </div>
        )}

        {!reimbursement && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="income-category" className="text-sm font-medium">
              {i.category}
            </label>
            <Select id="income-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={saving}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="income-amount" className="text-sm font-medium">
              {i.amount}
            </label>
            <Input
              id="income-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={saving || lockedReimbursement}
              autoFocus={!reimbursement}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="income-currency" className="text-sm font-medium">
              {i.currency}
            </label>
            <Select
              id="income-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              disabled={saving || lockedReimbursement}
            >
              <option value="CRC">CRC</option>
              <option value="USD">USD</option>
            </Select>
          </div>
        </div>

        {preview && (
          <p className={preview.tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{preview.text}</p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="income-date" className="text-sm font-medium">
            {i.date}
          </label>
          <Input id="income-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving || lockedReimbursement} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="income-description" className="text-sm font-medium">
            {i.description} <span className="font-normal text-muted-foreground">({i.optional})</span>
          </label>
          <Textarea id="income-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={saving} />
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
