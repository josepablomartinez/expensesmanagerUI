import * as React from "react";
import { Plus, X, Pencil, Check } from "lucide-react";
import { api, ApiError, type Bank, type CardType, type CreditCard, type UpdateCreditCardRequest } from "@/lib/api";
import { BankBadge, CardNetworkBadge } from "@/lib/brandIcons";
import { formatMoney } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
}

// Editable subset: credit_limit, cutoff_day, due_day, active. bank/card_type/
// last4 define the physical card and aren't expected to change after
// entry -- deactivate and re-add for a typo, same tradeoff as categories not
// supporting a name-only rename of the wrong subcategory.
function CreditCardRow({ card, onSave }: { card: CreditCard; onSave: (patch: UpdateCreditCardRequest) => Promise<void> }) {
  const [editing, setEditing] = React.useState(false);
  const [creditLimit, setCreditLimit] = React.useState(String(card.credit_limit));
  const [cutoffDay, setCutoffDay] = React.useState(card.cutoff_day != null ? String(card.cutoff_day) : "");
  const [dueDay, setDueDay] = React.useState(card.due_day != null ? String(card.due_day) : "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function resetFields() {
    setCreditLimit(String(card.credit_limit));
    setCutoffDay(card.cutoff_day != null ? String(card.cutoff_day) : "");
    setDueDay(card.due_day != null ? String(card.due_day) : "");
  }

  async function handleSave() {
    const limitNum = Number(creditLimit);
    if (creditLimit.trim() === "" || Number.isNaN(limitNum) || limitNum <= 0) {
      setError("Limit must be a positive number");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        credit_limit: limitNum,
        cutoff_day: cutoffDay.trim() === "" ? undefined : Number(cutoffDay),
        due_day: dueDay.trim() === "" ? undefined : Number(dueDay),
      });
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    setSaving(true);
    setError(null);
    try {
      await onSave({ active: !card.active });
    } catch (err) {
      setError(errorMessage(err, "Failed to update"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <BankBadge codeOrName={card.bank_name} />
          <CardNetworkBadge type={card.card_type} />
        </div>
        <div className="flex flex-1 flex-col">
          <span className="flex items-center gap-2 font-medium">
            •••• {card.last4}
            {!card.active && <span className="text-xs font-normal text-muted-foreground">(inactive)</span>}
          </span>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing((e) => !e)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" disabled={saving} onClick={handleToggleActive}>
          {card.active ? "Deactivate" : "Activate"}
        </Button>
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center gap-2 pl-9">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Limit ({card.limit_currency})</label>
            <Input
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              inputMode="decimal"
              className="h-8 w-32"
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Cutoff day</label>
            <Input
              value={cutoffDay}
              onChange={(e) => setCutoffDay(e.target.value)}
              inputMode="numeric"
              placeholder="1-31"
              className="h-8 w-20"
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Due day</label>
            <Input
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              inputMode="numeric"
              placeholder="1-31"
              className="h-8 w-20"
              disabled={saving}
            />
          </div>
          <Button size="icon" className="h-8 w-8 self-end" disabled={saving} onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 self-end"
            disabled={saving}
            onClick={() => {
              setEditing(false);
              resetFields();
              setError(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="pl-9 text-xs text-muted-foreground">
          Limit {formatMoney(card.credit_limit, card.limit_currency)}
          {card.cutoff_day != null && ` · Cutoff day ${card.cutoff_day}`}
          {card.due_day != null && ` · Due day ${card.due_day}`}
        </div>
      )}
      {error && <p className="pl-9 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function AddCreditCardForm({ banks, onAdd }: { banks: Bank[]; onAdd: (body: Parameters<typeof api.creditCards.create>[0]) => Promise<void> }) {
  const [open, setOpen] = React.useState(false);
  const [bankId, setBankId] = React.useState("");
  const [cardType, setCardType] = React.useState<CardType>("visa");
  const [last4, setLast4] = React.useState("");
  const [creditLimit, setCreditLimit] = React.useState("");
  const [limitCurrency, setLimitCurrency] = React.useState("CRC");
  const [cutoffDay, setCutoffDay] = React.useState("");
  const [dueDay, setDueDay] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add credit card
      </Button>
    );
  }

  function reset() {
    setBankId("");
    setCardType("visa");
    setLast4("");
    setCreditLimit("");
    setLimitCurrency("CRC");
    setCutoffDay("");
    setDueDay("");
  }

  async function handleAdd() {
    if (!bankId) {
      setError("Choose a bank");
      return;
    }
    if (!/^\d{4}$/.test(last4)) {
      setError("Last 4 digits must be exactly 4 numbers");
      return;
    }
    const limitNum = Number(creditLimit);
    if (creditLimit.trim() === "" || Number.isNaN(limitNum) || limitNum <= 0) {
      setError("Limit must be a positive number");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        bank_id: Number(bankId),
        card_type: cardType,
        last4,
        credit_limit: limitNum,
        limit_currency: limitCurrency,
        cutoff_day: cutoffDay.trim() === "" ? undefined : Number(cutoffDay),
        due_day: dueDay.trim() === "" ? undefined : Number(dueDay),
      });
      reset();
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err, "Failed to add card"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Bank</label>
          <Select value={bankId} onChange={(e) => setBankId(e.target.value)} className="h-8 w-48" disabled={saving}>
            <option value="" disabled>
              Choose bank
            </option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Type</label>
          <Select value={cardType} onChange={(e) => setCardType(e.target.value as CardType)} className="h-8 w-32" disabled={saving}>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="amex">Amex</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Last 4 digits</label>
          <Input
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="1234"
            className="h-8 w-20"
            disabled={saving}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Limit</label>
          <Input
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
            inputMode="decimal"
            placeholder="500000"
            className="h-8 w-28"
            disabled={saving}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Currency</label>
          <Select value={limitCurrency} onChange={(e) => setLimitCurrency(e.target.value)} className="h-8 w-24" disabled={saving}>
            <option value="CRC">CRC</option>
            <option value="USD">USD</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Cutoff day</label>
          <Input
            value={cutoffDay}
            onChange={(e) => setCutoffDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
            inputMode="numeric"
            placeholder="1-31"
            className="h-8 w-20"
            disabled={saving}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Due day</label>
          <Input
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
            inputMode="numeric"
            placeholder="1-31"
            className="h-8 w-20"
            disabled={saving}
          />
        </div>
        <Button size="sm" disabled={saving} onClick={handleAdd}>
          {saving ? "Adding…" : "Add"}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={saving}
          onClick={() => {
            setOpen(false);
            reset();
            setError(null);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function CreditCardsSection({ banks }: { banks: Bank[] }) {
  const [cards, setCards] = React.useState<CreditCard[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    return api.creditCards
      .list()
      .then(setCards)
      .catch((err) => setError(errorMessage(err, "Failed to load credit cards")));
  }, []);

  React.useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleAdd(body: Parameters<typeof api.creditCards.create>[0]) {
    await api.creditCards.create(body);
    await load();
  }

  async function handleSave(id: number, patch: UpdateCreditCardRequest) {
    await api.creditCards.update(id, patch);
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit cards</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground">No credit cards yet.</p>
            ) : (
              <div className="flex flex-col">
                {cards.map((card) => (
                  <CreditCardRow key={card.id} card={card} onSave={(patch) => handleSave(card.id, patch)} />
                ))}
              </div>
            )}
            {banks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No banks on file yet — banks are created automatically from exchange-rate data, so add one there
                first.
              </p>
            ) : (
              <AddCreditCardForm banks={banks} onAdd={handleAdd} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
