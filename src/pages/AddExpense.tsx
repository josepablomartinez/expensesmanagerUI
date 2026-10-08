import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarClock, ChevronDown, ChevronUp, Loader2, ReceiptText, X } from "lucide-react";
import { ApiError, api, type Category } from "@/lib/api";
import { localISODate } from "@/lib/date";
import { readPayPrefill } from "@/lib/recurrent";
import { prepareReceiptImage } from "@/lib/receiptImage";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/language";

function today() {
  return localISODate(new Date());
}

function nowHour() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Mirrors the "Format1" node in the manual Cash/SINPE n8n workflow: cash
// entries rarely have a bank-issued authorization code, so we derive a
// stable one from the transaction's own fields instead of leaving it blank.
function generateAuthCode(str: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

export default function AddExpense() {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // "Mark as paid" on a pending recurring payment links here with the
  // recurrence prefilled (see payUrl in lib/recurrent). Read once: the form
  // owns the values from then on.
  const [prefill] = React.useState(() => readPayPrefill(searchParams));
  const returnTo = prefill ? "/review?tab=recurring" : "/";
  const [categories, setCategories] = React.useState<Category[]>([]);
  const initialDate = React.useRef(today());
  const initialHour = React.useRef(nowHour());
  const initialMerchant = prefill?.name ?? "";
  const initialAmount = prefill?.amount != null ? String(prefill.amount) : "";
  const initialCurrency: string = prefill?.currency ?? "CRC";
  const initialCategoryId = prefill ? String(prefill.categoryId) : "";

  const [merchant, setMerchant] = React.useState(initialMerchant);
  const [amount, setAmount] = React.useState(initialAmount);
  const [currency, setCurrency] = React.useState(initialCurrency);
  const [date, setDate] = React.useState(initialDate.current);
  const [hour, setHour] = React.useState(initialHour.current);
  const [type, setType] = React.useState("CASH");
  const entity = "MANUAL";
  const country = "CRC";
  const city = "SJO";
  const [categoryId, setCategoryId] = React.useState(initialCategoryId);
  const [motive, setMotive] = React.useState("");
  // Bank reference read off an uploaded receipt; without one we derive a
  // stable code from the entry's own fields (see onSubmit).
  const [receiptAuth, setReceiptAuth] = React.useState<string | null>(null);
  const [reading, setReading] = React.useState(false);
  const [receiptNote, setReceiptNote] = React.useState<string | null>(null);
  const [receiptError, setReceiptError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // "2026-10" -> "October 2026" in the current language.
  function periodLabel(period: string) {
    const [year, month] = period.split("-").map(Number);
    return t.recurrent.periodLabel(t.months.full[month - 1], year);
  }
  // Open for a recurring payment, so the payment method isn't silently left
  // on the default.
  const [detailsOpen, setDetailsOpen] = React.useState(prefill != null);
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);
  const [desktop, setDesktop] = React.useState(() => window.matchMedia("(min-width: 768px)").matches);
  const formPanelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const isDirty = Boolean(
    merchant !== initialMerchant ||
      amount !== initialAmount ||
      categoryId !== initialCategoryId ||
      motive ||
      currency !== initialCurrency ||
      type !== "CASH" ||
      receiptAuth != null ||
      date !== initialDate.current ||
      hour !== initialHour.current,
  );

  React.useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

  async function onReceiptPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    setReceiptNote(null);
    setReceiptError(null);
    setReading(true);
    try {
      const { blob, name } = await prepareReceiptImage(file);
      const draft = await api.receipts.extract(blob, name);
      if (draft.amount != null) setAmount(String(draft.amount));
      if (draft.merchant) setMerchant(draft.merchant);
      if (draft.date) setDate(draft.date);
      if (draft.hour) setHour(draft.hour);
      if (draft.motive) setMotive(draft.motive);
      setType(draft.type);
      setCurrency("CRC");
      setReceiptAuth(draft.authorization);
      const found = draft.amount != null || draft.merchant != null;
      setReceiptNote(found ? t.addExpense.receiptRead : t.addExpense.receiptUnreadable);
    } catch (err) {
      // Only the API's own validation messages (bad type, too big, ...) are
      // worth showing; a 404/502/503 means the service is down or misconfigured.
      const friendly = err instanceof ApiError && [400, 413, 415].includes(err.status);
      setReceiptError(friendly ? err.message : t.addExpense.receiptFailed);
    } finally {
      setReading(false);
    }
  }

  function requestCancel() {
    if (saving) return;
    if (isDirty) {
      setConfirmingCancel(true);
      return;
    }
    navigate(returnTo);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError(t.addExpense.enterValidAmount);
      return;
    }

    const seed = `${date}|${parsedAmount}|${merchant || "Desconocido"}|${type}`;
    const authorization = receiptAuth ?? `GEN-${generateAuthCode(seed)}`;

    setSaving(true);
    try {
      await api.expenses.create({
        country,
        city,
        merchant: merchant || undefined,
        authorization,
        currency,
        date,
        hour,
        amount: parsedAmount,
        category_id: categoryId ? Number(categoryId) : undefined,
        entity,
        type,
        motive: motive || undefined,
        recurrent_expense_id: prefill?.recurrentExpenseId,
        recurrent_period: prefill?.period,
      });
      navigate(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.addExpense.failedToSaveExpense);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-lg md:fixed md:inset-0 md:z-30 md:flex md:max-w-none md:items-center md:justify-center md:bg-foreground/45 md:px-6 md:py-8 md:backdrop-blur-sm">
        <Card
          ref={formPanelRef}
          role={desktop ? "dialog" : undefined}
          aria-modal={desktop ? true : undefined}
          aria-label={desktop ? t.addExpense.title : undefined}
          onKeyDown={(event) => {
            if (!desktop || confirmingCancel) return;
            if (event.key === "Escape") { event.preventDefault(); requestCancel(); }
            if (event.key !== "Tab") return;
            const controls = Array.from(formPanelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])") ?? [])
              .filter((element) => element.getClientRects().length > 0);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }}
          className="w-full overflow-hidden rounded-panel shadow-xl md:max-h-[calc(100vh-4rem)] md:max-w-lg md:overflow-y-auto"
        >
          <form onSubmit={onSubmit} noValidate>
            <CardHeader className="flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-lg font-semibold text-foreground">{t.addExpense.title}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mr-2 h-9 w-9"
                onClick={requestCancel}
                disabled={saving}
                aria-label={t.common.close}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CardHeader>

            <CardContent className="flex flex-col gap-5 pt-5">
              {prefill && (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-foreground">
                      {t.addExpense.payingRecurrent(prefill.name, periodLabel(prefill.period))}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t.addExpense.payingRecurrentHelp}</p>
                  </div>
                </div>
              )}

              {!prefill && (
                <div className="rounded-lg border border-dashed border-border p-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onReceiptPicked}
                    aria-label={t.addExpense.uploadReceipt}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={reading || saving}
                  >
                    {reading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ReceiptText className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    {reading ? t.addExpense.readingReceipt : t.addExpense.uploadReceipt}
                  </Button>
                  {receiptError ? (
                    <p className="mt-2 text-sm text-destructive" role="alert">
                      {receiptError}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground" role="status">
                      {receiptNote ?? t.addExpense.receiptHint}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-secondary/55 p-4">
                <label htmlFor="expense-amount" className="mb-2 block text-sm font-medium text-foreground">
                  {t.addExpense.amountLabel}
                </label>
                <div className="flex gap-2">
                  <Input
                    id="expense-amount"
                    placeholder="0.00"
                    aria-label={t.addExpense.amountLabel}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 flex-1 bg-card text-2xl font-semibold"
                    autoFocus
                  />
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-12 w-24 bg-card"
                    aria-label={t.addExpense.currencyLabel}
                  >
                    <option value="CRC">CRC</option>
                    <option value="USD">USD</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="expense-description" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t.addExpense.descriptionLabel}
                  </label>
                  <Input
                    id="expense-description"
                    placeholder={t.addExpense.merchantPlaceholder}
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="expense-category" className="mb-1.5 block text-sm font-medium text-foreground">
                    {t.addExpense.categoryLabel}
                  </label>
                  <Select
                    id="expense-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={prefill != null}
                  >
                    <option value="">{t.common.uncategorized}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category} / {c.subcategory}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="expense-date" className="mb-1.5 block text-sm font-medium text-foreground">
                      {t.addExpense.dateLabel}
                    </label>
                    <Input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="expense-time" className="mb-1.5 block text-sm font-medium text-foreground">
                      {t.addExpense.timeLabel}
                    </label>
                    <Input id="expense-time" type="time" value={hour} onChange={(e) => setHour(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full justify-between px-1 text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => setDetailsOpen((open) => !open)}
                  aria-expanded={detailsOpen}
                  aria-controls="expense-optional-details"
                >
                  {t.addExpense.paymentAndNote}
                  {detailsOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                </Button>

                {detailsOpen && (
                  <div id="expense-optional-details" className="space-y-4 pt-3">
                    <div>
                      <label htmlFor="expense-payment" className="mb-1.5 block text-sm font-medium text-foreground">
                        {t.addExpense.paymentMethodLabel}
                      </label>
                      <Select id="expense-payment" value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="CASH">{t.addExpense.cashOption}</option>
                        <option value="SINPE">{t.addExpense.sinpeOption}</option>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="expense-note" className="mb-1.5 block text-sm font-medium text-foreground">
                        {t.addExpense.noteLabel}
                      </label>
                      <Textarea
                        id="expense-note"
                        placeholder={t.addExpense.notePlaceholder}
                        value={motive}
                        onChange={(e) => setMotive(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={requestCancel} disabled={saving}>
                  {t.common.cancel}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? t.common.saving : t.addExpense.saveExpense}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>

      {confirmingCancel && (
        <ExpenseDialog
          title={t.addExpense.discardTitle}
          description={<p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.addExpense.discardDescription}</p>}
          onClose={() => setConfirmingCancel(false)}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirmingCancel(false)}>
              {t.addExpense.keepEditing}
            </Button>
            <Button type="button" variant="destructive" onClick={() => navigate(returnTo)}>
              {t.addExpense.discard}
            </Button>
          </div>
        </ExpenseDialog>
      )}
    </>
  );
}
