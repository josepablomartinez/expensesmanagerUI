import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { useExpenseEvents } from "@/lib/events";
import { flagKind, type FlagKind } from "@/lib/flags";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/language";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DISMISS_AFTER_MS = 8000;

interface Alert {
  id: number;
  merchant: string;
  amount: number | null;
  currency: string | null;
  kind: FlagKind;
}

// Mounted once in AppShell so a flagged-expense alert (duplicate charge,
// unusual amount or unusual hour) shows up regardless of which page is open
// -- the persistent badge (Home/Review) only appears once you're looking at
// the flagged row, but a fraud-testing pattern is exactly the kind of thing
// worth surfacing immediately.
export function DuplicateAlertToast() {
  const t = useT();
  const [alerts, setAlerts] = React.useState<Alert[]>([]);

  const dismiss = React.useCallback((id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useExpenseEvents((event) => {
    if (event.type !== "created" || !event.flag_type) return;
    setAlerts((prev) => [
      ...prev,
      {
        id: event.id,
        merchant: event.merchant ?? event.entity ?? t.common.unknownMerchant,
        amount: event.amount ?? null,
        currency: event.currency ?? null,
        kind: flagKind(event.flag_type!),
      },
    ]);
    setTimeout(() => dismiss(event.id), DISMISS_AFTER_MS);
  });

  if (alerts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {alerts.map((alert) => (
        <Card key={alert.id} className="w-80 border-destructive/50 bg-destructive/5 shadow-lg">
          <CardContent className="flex items-start gap-3 pt-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-destructive">
                {alert.kind === "amount"
                  ? t.common.unusualAmount
                  : alert.kind === "hour"
                    ? t.common.unusualHour
                    : alert.kind === "suspicious"
                      ? t.common.suspiciousExpense
                      : t.common.possibleDuplicateCharge}
              </p>
              <p className="text-muted-foreground">
                {alert.merchant} · {formatMoney(alert.amount, alert.currency)}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label={t.common.dismiss}
              className="h-6 w-6 shrink-0"
              onClick={() => dismiss(alert.id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
