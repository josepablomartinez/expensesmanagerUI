import * as React from "react";
import type { Expense } from "@/lib/api";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { useT } from "@/lib/language";

interface Props {
  expense: Expense;
  onClose: () => void;
  onCleared: () => void;
}

export function ClearExpenseFlagDialog({ expense, onClose, onCleared }: Props) {
  const t = useT();
  const [error, setError] = React.useState<string | null>(null);
  const [clearing, setClearing] = React.useState(false);

  async function clearFlag() {
    setError(null);
    setClearing(true);
    try {
      await api.expenses.clearFlag(expense.id);
      onCleared();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.dialogs.clearFlag.failedToClear);
    } finally {
      setClearing(false);
    }
  }

  return (
    <ExpenseDialog
      title={t.dialogs.clearFlag.title(expense.merchant ?? expense.entity)}
      description={<p className="mt-1 text-sm text-muted-foreground">{t.dialogs.clearFlag.detail}</p>}
      onClose={onClose}
    >
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={clearing}>
          {t.common.cancel}
        </Button>
        <Button type="button" variant="destructive" className="flex-1" onClick={clearFlag} disabled={clearing}>
          {clearing ? t.dialogs.clearFlag.clearing : t.dialogs.clearFlag.clear}
        </Button>
      </div>
    </ExpenseDialog>
  );
}
