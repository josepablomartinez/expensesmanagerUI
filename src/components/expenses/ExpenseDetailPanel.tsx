import { CalendarDays, Copy, Landmark, MessageSquareText } from "lucide-react";
import type { CreditCard, Expense } from "@/lib/api";
import { BankBadge, CardNetworkBadge, resolveBank } from "@/lib/brandIcons";
import { Badge } from "@/components/ui/badge";
import { ExpenseDetailRow } from "@/components/expenses/ExpenseDetailRow";
import { useLanguage } from "@/lib/language";

function formatPaymentDate(iso: string, locale: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ExpenseDetails({ expense, creditCards }: { expense: Expense; creditCards: CreditCard[] }) {
  const { t, language } = useLanguage();
  const locale = language === "es" ? "es-CR" : "en-US";
  const card = expense.credit_card_id != null
    ? creditCards.find((candidate) => candidate.id === expense.credit_card_id)
    : undefined;
  const bank = card ? resolveBank(card.bank_name) : resolveBank(expense.entity);
  const typeLabel = t.expenseDetailPanel.typeLabels[expense.type ?? ""] ?? expense.type;
  const hasCard = expense.credit_card_id != null && Boolean(expense.card_type);
  const hasPaymentDate = hasCard && Boolean(expense.payment_date);
  const hasPaymentIdentity = Boolean(bank || hasCard || typeLabel);
  const nothingToShow = !hasPaymentIdentity && !hasPaymentDate && !expense.motive && !expense.flag_reason;

  return (
    <div className="mt-2 space-y-2.5 rounded-panel border border-border bg-background p-3 sm:ml-12">
      {nothingToShow ? (
        <p className="text-xs text-muted-foreground">{t.expenseDetailPanel.noAdditionalDetails}</p>
      ) : (
        <>
          {hasPaymentIdentity && (
            <ExpenseDetailRow icon={<Landmark className="h-4 w-4" />}>
              <div className="flex flex-wrap items-center gap-2">
                {bank && <BankBadge codeOrName={card ? card.bank_name : expense.entity} />}
                {hasCard ? (
                  <>
                    <CardNetworkBadge type={expense.card_type} />
                    {expense.card_last4 && <strong className="font-medium">•••• {expense.card_last4}</strong>}
                  </>
                ) : (
                  typeLabel && <Badge variant="outline">{typeLabel}</Badge>
                )}
              </div>
            </ExpenseDetailRow>
          )}

          {hasPaymentDate && (
            <ExpenseDetailRow icon={<CalendarDays className="h-4 w-4" />}>
              <span>
                {t.expenseDetailPanel.paymentDateLabel} {formatPaymentDate(expense.payment_date, locale)}
              </span>
            </ExpenseDetailRow>
          )}

          {expense.motive && (
            <ExpenseDetailRow icon={<MessageSquareText className="h-4 w-4" />}>
              <span className="text-muted-foreground">{expense.motive}</span>
            </ExpenseDetailRow>
          )}

          {expense.flag_reason && (
            <ExpenseDetailRow icon={<Copy className="h-4 w-4" />} className="text-destructive">
              <span>{expense.flag_reason}</span>
            </ExpenseDetailRow>
          )}
        </>
      )}
    </div>
  );
}

// Kept as a compatibility export while callers migrate to the shared naming.
export const ExpenseDetailPanel = ExpenseDetails;
