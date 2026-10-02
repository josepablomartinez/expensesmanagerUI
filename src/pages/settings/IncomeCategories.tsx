import * as React from "react";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError, type IncomeCategory } from "@/lib/api";
import { useT } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
}

function RenameDialog({
  category,
  onClose,
  onSaved,
}: {
  category: IncomeCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const c = t.incomeCategories;
  const [name, setName] = React.useState(category.name);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError(c.nameRequired);
    setSaving(true);
    setError(null);
    try {
      await api.income.renameCategory(category.id, name.trim());
      onSaved();
    } catch (err) {
      setError(errorMessage(err, c.failedToSave));
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog title={c.renameTitle(category.name)} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="income-category-name" className="text-sm font-medium">
            {c.nameLabel}
          </label>
          <Input
            id="income-category-name"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            autoFocus
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t.common.saving : t.common.save}
          </Button>
        </div>
      </form>
    </ExpenseDialog>
  );
}

function DeleteDialog({
  category,
  onClose,
  onDeleted,
}: {
  category: IncomeCategory;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const t = useT();
  const c = t.incomeCategories;
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    setSaving(true);
    setError(null);
    try {
      await api.income.deleteCategory(category.id);
      onDeleted();
    } catch (err) {
      setError(errorMessage(err, c.failedToDelete));
      setSaving(false);
    }
  }

  return (
    <ExpenseDialog title={c.deleteTitle(category.name)} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{c.deleteHelp}</p>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            {t.common.cancel}
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={handleDelete} disabled={saving}>
            {saving ? t.common.deleting : t.common.delete}
          </Button>
        </div>
      </div>
    </ExpenseDialog>
  );
}

// Settings > Income categories: add, rename, and delete the ones nothing has
// been filed under. The system reimbursement category is listed but locked.
export default function SettingsIncomeCategories() {
  const t = useT();
  const c = t.incomeCategories;
  const [categories, setCategories] = React.useState<IncomeCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<IncomeCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<IncomeCategory | null>(null);

  const load = React.useCallback(() => {
    return api.income
      .categories(true)
      .then((list) => {
        setCategories(list);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err, c.failedToLoad)))
      .finally(() => setLoading(false));
  }, [c.failedToLoad]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return setAddError(c.nameRequired);
    setAdding(true);
    setAddError(null);
    try {
      await api.income.createCategory(newName.trim());
      setNewName("");
      await load();
    } catch (err) {
      setAddError(errorMessage(err, c.failedToSave));
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted-foreground">{c.intro}</p>

      <form onSubmit={handleAdd} noValidate className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <Input
            aria-label={c.namePlaceholder}
            placeholder={c.namePlaceholder}
            value={newName}
            maxLength={50}
            onChange={(e) => setNewName(e.target.value)}
            disabled={adding}
          />
          <Button type="submit" className="shrink-0" disabled={adding}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{c.add}</span>
          </Button>
        </div>
        {addError && (
          <p className="text-sm text-destructive" role="alert">
            {addError}
          </p>
        )}
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!error && categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">{c.none}</p>
      ) : (
        <Card>
          <CardContent className="flex flex-col divide-y divide-border p-0">
            {categories.map((category) => {
              const locked = category.system_key != null;
              return (
                <div key={category.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{category.name}</p>
                    {locked && <p className="text-xs text-muted-foreground">{c.reimbursementNote}</p>}
                  </div>
                  {locked ? (
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label={`${c.rename}: ${category.name}`}
                        title={c.rename}
                        onClick={() => setRenameTarget(category)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-destructive-soft hover:text-destructive"
                        aria-label={`${c.delete}: ${category.name}`}
                        title={category.in_use ? c.inUse : c.delete}
                        disabled={category.in_use}
                        onClick={() => setDeleteTarget(category)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {renameTarget && (
        <RenameDialog
          category={renameTarget}
          onClose={() => setRenameTarget(null)}
          onSaved={() => {
            setRenameTarget(null);
            load();
          }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
