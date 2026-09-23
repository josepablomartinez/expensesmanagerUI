import type { Expense } from "@/lib/api";
import { flagIcons, flagKind, flagLabel } from "@/lib/flags";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";

export function ExpenseFlag({ expense, className }: { expense: Expense; className?: string }) {
  const t = useT();
  if (!expense.flag_type) return null;

  const kind = flagKind(expense.flag_type);
  const Icon = flagIcons[kind];

  return (
    <span
      className={cn("mt-1 inline-flex items-center gap-1 text-xs font-medium text-destructive", className)}
      title={expense.flag_reason ?? undefined}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{flagLabel(kind, t)}</span>
    </span>
  );
}
