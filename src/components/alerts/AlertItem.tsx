import { CircleCheck, Copy } from "lucide-react";
import type { ExpenseAlert } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

interface AlertItemProps {
  alert: ExpenseAlert;
  onOpen?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export function AlertItem({ alert, onOpen, onDismiss, compact = false }: AlertItemProps) {
  const { language, t } = useLanguage();
  const params = alert.payload?.params;
  const merchant = params?.merchant || t.common.unknownMerchant;
  const amount =
    params?.amount == null
      ? null
      : new Intl.NumberFormat(language === "es" ? "es-CR" : "en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(params.amount);
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
        {resolved ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{t.alerts.possibleDuplicate}</p>
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
