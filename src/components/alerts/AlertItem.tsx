import { CircleCheck } from "lucide-react";
import type { ExpenseAlert } from "@/lib/api";
import { flagIcons, type FlagKind } from "@/lib/flags";
import { useCurrency } from "@/lib/currency";
import { formatExpenseAmount, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

interface AlertItemProps {
  alert: ExpenseAlert;
  onOpen?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

function alertKind(alert: ExpenseAlert): FlagKind {
  switch (alert.payload?.template_key) {
    case "alert.suspicious_amount":
      return "amount";
    case "alert.suspicious_hour":
      return "hour";
    default:
      return alert.type === "suspicious_expense" ? "suspicious" : "duplicate";
  }
}

export function AlertItem({ alert, onOpen, onDismiss, compact = false }: AlertItemProps) {
  const { language, t } = useLanguage();
  const { currency } = useCurrency();
  const params = alert.payload?.params;
  const kind = alertKind(alert);
  const KindIcon = flagIcons[kind];
  const title =
    kind === "amount"
      ? t.alerts.unusualAmount
      : kind === "hour"
        ? t.alerts.unusualHour
        : kind === "suspicious"
          ? t.common.suspiciousExpense
          : t.alerts.possibleDuplicate;
  const detail =
    kind === "amount" && params?.ratio != null && params.median_colones != null
      ? t.alerts.unusualAmountDetail(
          params.ratio,
          currency === "USD" && params.median_dollars != null
            ? formatMoney(params.median_dollars, "USD")
            : formatMoney(params.median_colones, "CRC"),
        )
      : kind === "hour" && params?.hour_event
        ? t.alerts.unusualHourDetail(params.hour_event)
        : null;
  const merchant = params?.merchant || t.common.unknownMerchant;
  // Same display-currency rule as the expense lists. Alerts written before
  // the payload carried colones_amount/dollars_amount fall back to the raw
  // amount/currency.
  const amount =
    params?.amount == null
      ? null
      : formatExpenseAmount(
          {
            amount: params.amount,
            currency: params.currency,
            colones_amount: params.colones_amount,
            dollars_amount: params.dollars_amount,
          },
          currency,
        );
  const created = new Intl.DateTimeFormat(language === "es" ? "es-CR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(alert.created_at));
  const resolved = Boolean(alert.resolved_at);
  const status = resolved
    ? t.alerts.resolved
    : alert.dismissed_at
      ? t.alerts.dismissed
      : alert.read_at
        ? t.alerts.read
        : null;

  return (
    <article
      className={cn(
        "relative flex items-start gap-3 border-t border-border first:border-t-0",
        compact ? "px-1 py-3" : "rounded-panel border border-border bg-card p-4 first:border-t",
        resolved && "opacity-75",
      )}
    >
      {!alert.read_at && !alert.dismissed_at && (
        <span className="absolute left-1.5 top-5 h-1.5 w-1.5 rounded-full bg-primary" aria-label={t.alerts.unread} />
      )}
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          resolved ? "bg-secondary text-secondary-foreground" : "bg-destructive-soft text-destructive",
        )}
      >
        {resolved ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : <KindIcon className="h-4 w-4" aria-hidden="true" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        {detail && <p className="mt-0.5 text-sm text-foreground/80">{detail}</p>}
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {[merchant, amount, created, status].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {onOpen && alert.related_expense_id != null && (
            <Button type="button" variant="ghost" size="sm" className="h-auto px-0 py-1 text-primary hover:bg-transparent" onClick={onOpen}>
              {t.alerts.reviewExpense}
            </Button>
          )}
          {onDismiss && (
            <Button type="button" variant="ghost" size="sm" className="h-auto px-0 py-1 text-muted-foreground hover:bg-transparent" onClick={onDismiss}>
              {t.common.dismiss}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
