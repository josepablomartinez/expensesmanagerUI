import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api, type Category } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddExpense() {
  const navigate = useNavigate();
  const [categories, setCategories] = React.useState<Category[]>([]);

  const [commerce, setCommerce] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("CRC");
  const [amountColones, setAmountColones] = React.useState("");
  const [date, setDate] = React.useState(today());
  const [type, setType] = React.useState("CARD");
  const entity = "MANUAL";
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
      setError("Enter a valid amount");
      return;
    }
    if (currency === "USD" && (!amountColones || Number(amountColones) <= 0)) {
      setError("Amount in colones is required for USD expenses");
      return;
    }

    setSaving(true);
    try {
      await api.expenses.create({
        commerce: commerce || undefined,
        currency,
        date,
        amount: parsedAmount,
        category_id: categoryId ? Number(categoryId) : undefined,
        entity,
        type,
        motive: motive || undefined,
        amount_colones: currency === "USD" ? Number(amountColones) : undefined,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold">Add expense</h1>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input placeholder="Commerce / merchant" value={commerce} onChange={(e) => setCommerce(e.target.value)} autoFocus />

            <div className="flex gap-2">
              <Input
                placeholder="Amount"
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
                placeholder="Amount in colones"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amountColones}
                onChange={(e) => setAmountColones(e.target.value)}
              />
            )}

            <div className="flex gap-2">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1" />
              <Select value={type} onChange={(e) => setType(e.target.value)} className="w-28">
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
                <option value="SINPE">Sinpe</option>
              </Select>
            </div>

            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category} / {c.subcategory}
                </option>
              ))}
            </Select>

            <Input placeholder="Note (optional)" value={motive} onChange={(e) => setMotive(e.target.value)} />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save expense"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
