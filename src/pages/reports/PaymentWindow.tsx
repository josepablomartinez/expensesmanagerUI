import * as React from "react";
import { api, type PaymentWindowRow } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PaymentWindowCategory, groupPaymentWindow } from "@/components/reports/PaymentWindowCategory";
import { splitCategoryName } from "@/lib/categoryGrouping";
import { useT } from "@/lib/language";

export default function PaymentWindow() {
  const { currency } = useCurrency();
  const t = useT();
  const [monthsBack, setMonthsBack] = React.useState(2);
  const [mainCategoryId, setMainCategoryId] = React.useState<number | null>(null);
  const [rows, setRows] = React.useState<PaymentWindowRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Always fetch unfiltered so the main-category dropdown keeps all its
  // options; the filter is applied client-side.
  React.useEffect(() => {
    setLoading(true);
    setError(null);
    api.reports
      .paymentWindow(monthsBack)
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : t.paymentWindow.failedToLoad))
      .finally(() => setLoading(false));
  }, [monthsBack, t.paymentWindow.failedToLoad]);

  const mainCategories = React.useMemo(() => {
    const map = new Map<number, string>();
    for (const r of rows) map.set(r.main_category_id, splitCategoryName(r.category_name).mainName);
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const groups = React.useMemo(
    () => groupPaymentWindow(rows.filter((r) => mainCategoryId == null || r.main_category_id === mainCategoryId)),
    [rows, mainCategoryId],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t.paymentWindow.title}</h2>
          <p className="text-sm text-muted-foreground">{t.paymentWindow.description}</p>
        </div>
        <div className="flex gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            {t.paymentWindow.mainCategory}
            <Select value={mainCategoryId ?? ""} onChange={(e) => setMainCategoryId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t.paymentWindow.allCategories}</option>
              {mainCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            {t.paymentWindow.months}
            <Select value={monthsBack} onChange={(e) => setMonthsBack(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </label>
        </div>
      </div>
      {loading ? <p className="text-sm text-muted-foreground">{t.common.loading}</p> : error ? <p className="text-sm text-destructive">{error}</p> : groups.length === 0 ? (
        <Card><CardContent className="pt-4 text-sm text-muted-foreground">{t.paymentWindow.noData}</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((list) => (
            <Card key={list[0].category_id}><CardContent className="pt-4"><PaymentWindowCategory rows={list} currency={currency} showMainCategory /></CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
