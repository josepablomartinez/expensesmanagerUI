import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api, type PaymentWindowRow } from "@/lib/api";
import { useCurrency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentWindowCategory, groupPaymentWindow } from "@/components/reports/PaymentWindowCategory";
import { useT } from "@/lib/language";

// Always this month and next: what's already spent/charged against each
// favorite category's budget, by payment date (see GET /reports/payment-window).
const WINDOW_MONTHS = 2;

export function FavoriteCategoriesWidget({ favoriteCategoryIds }: { favoriteCategoryIds: number[] }) {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const t = useT();
  const [rows, setRows] = React.useState<PaymentWindowRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (favoriteCategoryIds.length === 0) {
      setLoading(false);
      return;
    }
    api.reports
      .paymentWindow(WINDOW_MONTHS)
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favoriteCategoryIds]);

  if (favoriteCategoryIds.length === 0) return null;

  // Unlike the report page, keep favorites even with no spend so a category
  // you pinned doesn't silently vanish from the dashboard.
  const groups = groupPaymentWindow(
    rows.filter((r) => favoriteCategoryIds.includes(r.category_id)),
    true,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>{t.dashboard.favoriteCategories.title}</CardTitle>
        <button
          type="button"
          onClick={() => navigate("/reports/payment-window")}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t.dashboard.favoriteCategories.reports}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t.common.loading}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.dashboard.favoriteCategories.noData}</p>
        ) : (
          groups.map((list) => <PaymentWindowCategory key={list[0].category_id} rows={list} currency={currency} />)
        )}
      </CardContent>
    </Card>
  );
}
