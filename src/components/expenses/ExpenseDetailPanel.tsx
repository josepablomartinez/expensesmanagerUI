import type { CreditCard, Expense } from "@/lib/api";
import { BankBadge, CardNetworkBadge, resolveBank } from "@/lib/brandIcons";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
  CARD: "Card",
  CASH: "Cash",
  SINPE: "SINPE",
};

// The "card below the expense, open on demand" -- shows the linked credit
// card (network, last4, its bank) when there is one, otherwise falls back to
// `entity` (the bank/channel the expense came through, e.g. "BAC", or
// "MANUAL" for entries with no known bank) plus the payment type. Either way
// the reason/motive, if any, is shown last.
export function ExpenseDetailPanel({ expense, creditCards }: { expense: Expense; creditCards: CreditCard[] }) {
  const card = expense.credit_card_id != null ? creditCards.find((c) => c.id === expense.credit_card_id) : undefined;
  const bank = card ? resolveBank(card.bank_name) : resolveBank(expense.entity);
  const typeLabel = TYPE_LABELS[expense.type ?? ""] ?? expense.type;

  const hasCard = expense.credit_card_id != null && expense.card_type;
  const nothingToShow = !bank && !hasCard && !expense.motive && !expense.flag_reason;

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-border bg-secondary/30 p-3 text-sm">
      {nothingToShow ? (
        <p className="text-xs text-muted-foreground">No additional details.</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {bank && <BankBadge codeOrName={card ? card.bank_name : expense.entity} />}
            {hasCard ? (
              <>
                <CardNetworkBadge type={expense.card_type} />
                <span className="font-medium">•••• {expense.card_last4}</span>
              </>
            ) : (
              typeLabel && <Badge variant="outline">{typeLabel}</Badge>
            )}
          </div>

          {expense.motive && <p className="text-muted-foreground">{expense.motive}</p>}
          {expense.flag_reason && <p className="text-destructive">{expense.flag_reason}</p>}
        </>
      )}
    </div>
  );
}
