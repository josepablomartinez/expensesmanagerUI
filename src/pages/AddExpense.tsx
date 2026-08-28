import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api, type Category } from "@/lib/api";
import { localISODate } from "@/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

  const [merchant, setMerchant] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("CRC");
  const [amountColones, setAmountColones] = React.useState("");
  const [date, setDate] = React.useState(today());
  const [hour, setHour] = React.useState(nowHour());
  const [type, setType] = React.useState("CARD");
  const entity = "MANUAL";
  const country = "CRC";
  const city = "SJO";
  const [categoryId, setCategoryId] = React.useState("");
  const [motive, setMotive] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
  }, []);

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
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">{t.addExpense.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.addExpense.details}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input placeholder={t.addExpense.merchantPlaceholder} value={merchant} onChange={(e) => setMerchant(e.target.value)} autoFocus />

            <div className="flex gap-2">
              <Input
                placeholder={t.addExpense.amountPlaceholder}
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-28">
                <option value="CRC">CRC</option>
                <option value="USD">USD</option>
              </Select>
            </div>

            {currency === "USD" && (
              <Input
                placeholder={t.addExpense.amountInColonesPlaceholder}
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amountColones}
                onChange={(e) => setAmountColones(e.target.value)}
              />
            )}

            <div className="flex gap-2">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1" />
              <Input type="time" value={hour} onChange={(e) => setHour(e.target.value)} className="flex-1" />
              <Select value={type} onChange={(e) => setType(e.target.value)} className="w-28">
                <option value="CARD">{t.addExpense.cardOption}</option>
                <option value="CASH">{t.addExpense.cashOption}</option>
                <option value="SINPE">{t.addExpense.sinpeOption}</option>
              </Select>
            </div>

            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t.common.uncategorized}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category} / {c.subcategory}
                </option>
              ))}
            </Select>

            <Input placeholder={t.addExpense.notePlaceholder} value={motive} onChange={(e) => setMotive(e.target.value)} />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={saving}>
              {saving ? t.common.saving : t.addExpense.saveExpense}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
