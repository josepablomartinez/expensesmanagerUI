import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { api, ApiError, type Category, type CategoryState, type MainCategory, type RecurrentExpense } from "@/lib/api";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useT } from "@/lib/language";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
}

export function categoryLabel(c: Pick<Category, "category" | "subcategory">) {
  return `${c.category} / ${c.subcategory}`;
}

// Disable confirmation. The simple case is one click; the replacement and
// the (history-rewriting) move live in a collapsed "Advanced" section.
// Blocked up front while an active recurring payment uses the category --
// the API enforces the same rule (409), this just says so before trying.
export function DisableCategoryDialog({
  category,
  categories,
  activeRecurrence,
  onClose,
  onDisabled,
}: {
  category: Category;
  // Every category the user has; only enabled ones other than `category`
  // are offered as targets.
  categories: Category[];
  activeRecurrence: RecurrentExpense | undefined;
  onClose: () => void;
  onDisabled: (result: CategoryState) => void;
}) {
  const t = useT();
  const d = t.categories.disableDialog;
  const navigate = useNavigate();
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [replacementId, setReplacementId] = React.useState("");
  const [moveToId, setMoveToId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const targets = React.useMemo(
    () => categories.filter((c) => c.id !== category.id && c.disabled_at == null),
    [categories, category.id],
  );

  async function handleDisable() {
    setSaving(true);
    setError(null);
    try {
      const result = await api.categories.disable(category.id, {
        replacedById: replacementId ? Number(replacementId) : undefined,
        moveToId: moveToId ? Number(moveToId) : undefined,
      });
      onDisabled(result);
    } catch (err) {
      setError(errorMessage(err, d.failed));
      setSaving(false);
    }
  }

  const targetOptions = (
    <>
      <option value="">{d.none}</option>
      {targets.map((c) => (
        <option key={c.id} value={c.id}>
          {categoryLabel(c)}
        </option>
      ))}
    </>
  );

  return (
    <ExpenseDialog title={d.title(categoryLabel(category))} onClose={onClose} className="max-w-md">
      <div className="flex flex-col gap-4">
        {activeRecurrence ? (
          <div className="flex flex-col gap-2 rounded-md border border-warning bg-warning-soft p-3 text-sm">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              {d.blockedByRecurring(activeRecurrence.name)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => navigate(`/settings/recurring?focus=${activeRecurrence.id}`)}
            >
              {d.manageRecurring}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{d.body}</p>
        )}

        {!activeRecurrence && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setAdvancedOpen((open) => !open)}
              aria-expanded={advancedOpen}
              className="flex items-center gap-1 self-start text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {advancedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {d.advanced}
            </button>
            {advancedOpen && (
              <div className="flex flex-col gap-4 border-l-2 border-border pl-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="disable-replacement" className="text-sm font-medium">
                    {d.replacement}
                  </label>
                  <Select
                    id="disable-replacement"
                    value={replacementId}
                    onChange={(e) => setReplacementId(e.target.value)}
                    disabled={saving}
                  >
                    {targetOptions}
                  </Select>
                  <p className="text-xs text-muted-foreground">{d.replacementHint}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="disable-move" className="text-sm font-medium">
                    {d.moveExpenses}
                  </label>
                  <Select id="disable-move" value={moveToId} onChange={(e) => setMoveToId(e.target.value)} disabled={saving}>
                    {targetOptions}
                  </Select>
                  <p className={moveToId ? "flex items-start gap-1.5 text-xs text-warning" : "text-xs text-muted-foreground"}>
                    {moveToId && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    {d.moveExpensesHint}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={handleDisable}
            disabled={saving || activeRecurrence != null}
          >
            {saving ? t.common.saving : d.confirm}
          </Button>
        </div>
      </div>
    </ExpenseDialog>
  );
}

// Moves a subcategory under another main category. Everything that points
// at the subcategory (expenses, budget, recurrence) goes with it.
export function MoveSubcategoryDialog({
  category,
  mainCategories,
  onClose,
  onMoved,
}: {
  category: Category;
  mainCategories: MainCategory[];
  onClose: () => void;
  onMoved: () => void;
}) {
  const t = useT();
  const m = t.categories.moveDialog;
  const [mainCategoryId, setMainCategoryId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const options = mainCategories
    .filter((mc) => mc.id !== category.main_category_id)
    .sort((a, b) => a.name.localeCompare(b.name));

  async function handleMove() {
    if (!mainCategoryId) return;
    setSaving(true);
    setError(null);
    try {
      await api.categories.update(category.id, { mainCategoryId: Number(mainCategoryId) });
      onMoved();
    } catch (err) {
      setError(errorMessage(err, m.failed));
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog title={m.title(categoryLabel(category))} onClose={onClose} className="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="move-main-category" className="text-sm font-medium">
            {m.mainCategory}
          </label>
          <Select
            id="move-main-category"
            value={mainCategoryId}
            onChange={(e) => setMainCategoryId(e.target.value)}
            disabled={saving}
          >
            <option value="" disabled>
              {m.choose}
            </option>
            {options.map((mc) => (
              <option key={mc.id} value={mc.id}>
                {mc.name}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">{m.hint}</p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="button" className="flex-1" onClick={handleMove} disabled={saving || !mainCategoryId}>
            {saving ? t.common.saving : m.confirm}
          </Button>
        </div>
      </div>
    </ExpenseDialog>
  );
}
