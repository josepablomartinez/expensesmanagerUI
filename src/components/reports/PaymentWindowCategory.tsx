import { Flame } from "lucide-react";
import type { PaymentWindowRow } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { DisplayCurrency } from "@/lib/currency";
import { splitCategoryName } from "@/lib/categoryGrouping";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language";

// Same severity convention as the Budget vs actual report.
function severityBarClass(pct: number) {
  if (pct >= 100) return "bg-destructive";
  if (pct >= 90) return "bg-warning";
  if (pct >= 75) return "bg-amber-500";
  return "bg-primary";
}

// month_start is "YYYY-MM-DD"; build a local Date from the parts rather than
// new Date(string), which parses as UTC and shows the previous month in
// timezones behind UTC.
function monthLabel(monthStart: string, locale: string) {
  const [y, m] = monthStart.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(y, m - 1, 1));
}

// One category's rows (one per payment month, newest first) as independent
// bars against the category's current budget.
export function PaymentWindowCategory({
  rows,
  currency,
  showMainCategory = false,
}: {
  rows: PaymentWindowRow[];
  currency: DisplayCurrency;
  showMainCategory?: boolean;
}) {
  const { language, t } = useLanguage();
  const budget = currency === "USD" ? rows[0].budget_usd : rows[0].budget;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">
          {showMainCategory && <span className="text-xs text-muted-foreground">{splitCategoryName(rows[0].category_name).mainName} / </span>}
          <span className="font-medium">{splitCategoryName(rows[0].category_name).subName}</span>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {t.paymentWindow.budget}: {budget != null ? formatMoney(budget, currency) : "—"}
        </span>
      </div>
      {rows.map((row) => {
        const spent = currency === "USD" ? row.spent_usd : row.spent_crc;
        const pct = budget != null && budget > 0 ? (spent / budget) * 100 : 0;
        const over = pct >= 100;
        return (
          <div key={row.month_start} className="flex items-center gap-2">
            <span className="w-9 shrink-0 text-xs uppercase text-muted-foreground">{monthLabel(row.month_start, language)}</span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className={cn("h-full rounded-full", severityBarClass(pct))} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            {over ? <Flame className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" /> : <span className="w-4 shrink-0" />}
            <span className={cn("w-28 shrink-0 text-right text-sm tabular-nums", over && "font-medium text-destructive")}>
              {formatMoney(spent, currency)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Groups the flat (category, month) rows by category, dropping categories
// with no spend anywhere in the window (unless keepEmpty) so the list stays
// short.
export function groupPaymentWindow(rows: PaymentWindowRow[], keepEmpty = false): PaymentWindowRow[][] {
  const byCategory = new Map<number, PaymentWindowRow[]>();
  for (const row of rows) {
    const list = byCategory.get(row.category_id);
    if (list) list.push(row);
    else byCategory.set(row.category_id, [row]);
  }
  const all = Array.from(byCategory.values());
  return keepEmpty ? all : all.filter((list) => list.some((r) => r.spent_crc > 0 || r.spent_usd > 0));
}
