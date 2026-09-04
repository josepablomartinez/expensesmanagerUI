import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CreditCard, Expense } from "@/lib/api";
import { formatExpenseAmount } from "@/lib/format";
import { useCurrency } from "@/lib/currency";
import { getCategoryIcon, mainCategoryOf } from "@/lib/categoryIcons";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";
import { ExpenseActions } from "@/components/expenses/ExpenseActions";
import { ExpenseDetails } from "@/components/expenses/ExpenseDetailPanel";
import { ExpenseFlag } from "@/components/expenses/ExpenseFlag";

interface ExpenseFrameProps {
  expense: Expense;
  creditCards: CreditCard[];
  expanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onSplit?: () => void;
  onClearFlag?: () => void;
  onDelete?: () => void;
  status?: ReactNode;
  showDate?: boolean;
  className?: string;
}

function timeLabel(hour: string | null) {
  return hour ? hour.slice(0, 5) : null;
}

export function ExpenseFrame({
  expense,
  creditCards,
  expanded,
  onToggle,
  onEdit,
  onSplit,
  onClearFlag,
  onDelete,
  status,
  showDate = false,
  className,
}: ExpenseFrameProps) {
  const { currency } = useCurrency();
  const t = useT();
  const Icon = getCategoryIcon(mainCategoryOf(expense.category_name));
  const merchant = expense.merchant ?? expense.entity;
  const metadata = [
    showDate ? expense.date.slice(0, 10) : null,
    expense.category_name ?? t.common.uncategorized,
    timeLabel(expense.hour),
  ].filter(Boolean);

  return (
    <article className={cn("rounded-lg border border-border bg-card px-3 py-2.5 text-card-foreground", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={t.common.toggleExpenseDetails}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{merchant}</span>
            <span className="block truncate text-xs text-muted-foreground">{metadata.join(" · ")}</span>
            <ExpenseFlag expense={expense} />
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
        </button>

        <div className="flex flex-wrap items-center justify-end gap-1 pl-12 sm:flex-nowrap sm:pl-0">
          {status}
          <strong className="whitespace-nowrap text-sm font-medium">{formatExpenseAmount(expense, currency)}</strong>
          <ExpenseActions
            onEdit={onEdit}
            onSplit={onSplit}
            onClearFlag={onClearFlag}
            onDelete={onDelete}
          />
        </div>
      </div>

      {expanded && <ExpenseDetails expense={expense} creditCards={creditCards} />}
    </article>
  );
}
