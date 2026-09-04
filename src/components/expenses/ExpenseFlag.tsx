import { Copy, ShieldAlert } from "lucide-react";
import type { Expense } from "@/lib/api";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";

export function ExpenseFlag({ expense, className }: { expense: Expense; className?: string }) {
  const t = useT();
  if (!expense.flag_type) return null;

  const isSuspicious = expense.flag_type.toLowerCase().includes("suspicious");
  const Icon = isSuspicious ? ShieldAlert : Copy;

  return (
    <span
      className={cn("mt-1 inline-flex items-center gap-1 text-xs font-medium text-destructive", className)}
      title={expense.flag_reason ?? undefined}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{isSuspicious ? t.common.suspiciousExpense : t.common.possibleDuplicate}</span>
    </span>
  );
}
