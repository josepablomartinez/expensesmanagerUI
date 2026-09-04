import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { api, type Category } from "@/lib/api";
import { localISODate } from "@/lib/date";
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
  const [categories, setCategories] = React.useState<Category[]>([]);
  const initialDate = React.useRef(today());
  const initialHour = React.useRef(nowHour());

  const [merchant, setMerchant] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("CRC");
  const [amountColones, setAmountColones] = React.useState("");
  const [date, setDate] = React.useState(initialDate.current);
  const [hour, setHour] = React.useState(initialHour.current);
  const [type, setType] = React.useState("CASH");
  const entity = "MANUAL";
  const country = "CRC";
  const city = "SJO";
  const [categoryId, setCategoryId] = React.useState("");
  const [motive, setMotive] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [confirmingCancel, setConfirmingCancel] = React.useState(false);

  const isDirty = Boolean(
    merchant ||
      amount ||
      amountColones ||
      categoryId ||
      motive ||
      currency !== "CRC" ||
      type !== "CASH" ||
      date !== initialDate.current ||
      hour !== initialHour.current,
  );

  React.useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

  function requestCancel() {
    if (saving) return;
    if (isDirty) {
      setConfirmingCancel(true);
      return;
    }
    navigate("/");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError(t.addExpense.enterValidAmount);
      return;
    }
    if (currency === "USD" && (!amountColones || Number(amountColones) <= 0)) {
      setError(t.addExpense.amountInColonesRequired);
      return;
    }

    const seed = `${date}|${parsedAmount}|${merchant || "Desconocido"}|${type}`;
    const authorization = `GEN-${generateAuthCode(seed)}`;

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
        amount_colones: currency === "USD" ? Number(amountColones) : undefined,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.addExpense.failedToSaveExpense);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-lg md:fixed md:inset-0 md:z-30 md:flex md:max-w-none md:items-center md:justify-center md:bg-foreground/45 md:px-6 md:py-8 md:backdrop-blur-sm">
        <Card className="w-full overflow-hidden rounded-panel shadow-xl md:max-h-[calc(100vh-4rem)] md:max-w-lg md:overflow-y-auto">
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

                {currency === "USD" && (
                  <div className="mt-3">
                    <label htmlFor="expense-colones" className="mb-1.5 block text-sm font-medium text-foreground">
                      {t.addExpense.amountInColonesLabel}
                    </label>
                    <Input
                      id="expense-colones"
                      placeholder={t.addExpense.amountInColonesPlaceholder}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={amountColones}
                      onChange={(e) => setAmountColones(e.target.value)}
                      className="bg-card"
                    />
                  </div>
                )}
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
                  <Select id="expense-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
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
            <Button type="button" variant="destructive" onClick={() => navigate("/")}>
              {t.addExpense.discard}
            </Button>
          </div>
        </ExpenseDialog>
      )}
    </>
  );
}
