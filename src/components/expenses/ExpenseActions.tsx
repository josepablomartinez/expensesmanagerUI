import { FlagOff, Pencil, Split, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";

interface ExpenseActionsProps {
  onEdit?: () => void;
  onSplit?: () => void;
  onClearFlag?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ExpenseActions({ onEdit, onSplit, onClearFlag, onDelete, className }: ExpenseActionsProps) {
  const t = useT();

  if (!onEdit && !onSplit && !onClearFlag && !onDelete) return null;

  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={t.common.expenseActions}>
      {onEdit && (
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={t.common.editCategory} onClick={onEdit}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      {onSplit && (
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={t.common.splitExpense} onClick={onSplit}>
          <Split className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      {onClearFlag && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:bg-destructive-soft hover:text-destructive"
          aria-label={t.common.clearExpenseFlag}
          onClick={onClearFlag}
        >
          <FlagOff className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      {onDelete && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 hover:bg-destructive-soft hover:text-destructive"
          aria-label={t.common.deleteExpense}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
