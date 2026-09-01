import type { CreditCard, Expense } from "@/lib/api";
import { BankBadge, CardNetworkBadge, resolveBank } from "@/lib/brandIcons";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/language";

// date/payment_date come back as full timestamps (e.g. "2026-08-10T00:00:00Z")
// even though they're DATE columns -- compare/format on the YYYY-MM-DD
// prefix only, and build the Date from local y/m/d parts (not `new
// Date(iso)`) so it doesn't roll over a day in timezones behind UTC. See
// src/lib/date.ts's localISODate for the same concern in the other direction.
function formatPaymentDate(iso: string, locale: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

// The "card below the expense, open on demand" -- shows the linked credit
// card (network, last4, its bank) when there is one, otherwise falls back to
// `entity` (the bank/channel the expense came through, e.g. "BAC", or
// "MANUAL" for entries with no known bank) plus the payment type. If the
// user's credit_card_expense_date setting shifted this expense's payment
// date away from the day it happened, that's called out next. Either way
// the reason/motive, if any, is shown last.
export function ExpenseDetailPanel({ expense, creditCards }: { expense: Expense; creditCards: CreditCard[] }) {
  const { t, language } = useLanguage();
  const locale = language === "es" ? "es-CR" : "en-US";
  const card = expense.credit_card_id != null ? creditCards.find((c) => c.id === expense.credit_card_id) : undefined;
  const bank = card ? resolveBank(card.bank_name) : resolveBank(expense.entity);
  const typeLabel = t.expenseDetailPanel.typeLabels[expense.type ?? ""] ?? expense.type;

  const hasCard = expense.credit_card_id != null && expense.card_type;
  const paymentDateShifted = expense.payment_date.slice(0, 10) !== expense.date.slice(0, 10);
  const nothingToShow = !bank && !hasCard && !expense.motive && !expense.flag_reason && !paymentDateShifted;

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-border bg-secondary/30 p-3 text-sm">
      {nothingToShow ? (
        <p className="text-xs text-muted-foreground">{t.expenseDetailPanel.noAdditionalDetails}</p>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {bank && <BankBadge codeOrName={card ? card.bank_name : expense.entity} />}
            {hasCard ? (
              <>
                <CardNetworkBadge type={expense.card_type} />
                <span className="font-medium">•••• {expense.card_last4}</span>
              </>
            ) : (
              typeLabel && <Badge variant="outline">{typeLabel}</Badge>
            )}
            {paymentDateShifted && (
              <Badge variant="secondary">
                {t.expenseDetailPanel.paymentDateLabel} {formatPaymentDate(expense.payment_date, locale)}
              </Badge>
            )}
          </div>

          {expense.motive && <p className="text-muted-foreground">{expense.motive}</p>}
          {expense.flag_reason && <p className="text-destructive">{expense.flag_reason}</p>}
        </>
      )}
    </div>
  );
}
