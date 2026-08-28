import * as React from "react";
import { Check, Pencil, Plus, X } from "lucide-react";
import { api, ApiError, type Category, type MainCategory } from "@/lib/api";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/language";

interface MainGroup {
  mainCategoryId: number;
  mainName: string;
  items: Category[];
}

// Seeded from mainCategories (every group, including empty ones -- GET
// /categories inner-joins to categories and so omits a main category with
// nothing under it yet) with subcategories from `categories` attached on
// top.
function groupCategories(mainCategories: MainCategory[], categories: Category[]): MainGroup[] {
  const map = new Map<number, MainGroup>();
  for (const mc of mainCategories) {
    map.set(mc.id, { mainCategoryId: mc.id, mainName: mc.name, items: [] });
  }
  for (const c of categories) {
    const existing = map.get(c.main_category_id);
    if (existing) {
      existing.items.push(c);
    } else {
      map.set(c.main_category_id, { mainCategoryId: c.main_category_id, mainName: c.category, items: [c] });
    }
  }
  for (const group of map.values()) {
    group.items.sort((a, b) => a.subcategory.localeCompare(b.subcategory));
  }
  return Array.from(map.values()).sort((a, b) => a.mainName.localeCompare(b.mainName));
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
}

// Inline-editable main category name -- a pencil icon toggles between the
// static heading and a text input, mirroring the row-level edit affordance
// below rather than keeping the whole page permanently in edit mode.
function MainCategoryName({ name, onSave }: { name: string; onSave: (name: string) => Promise<void> }) {
  const t = useT();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(name);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!editing) setValue(name);
  }, [name, editing]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex items-center gap-2 text-left"
      >
        <span className="font-semibold">{name}</span>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err, t.categories.failedToRename));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setEditing(false);
              setValue(name);
            }
          }}
          className="h-8 w-48 font-semibold"
          disabled={saving}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={saving}
          onClick={() => {
            setEditing(false);
            setValue(name);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// One subcategory row -- subcategory name and budget are always editable;
// the check button only enables once something actually changed.
function SubcategoryRow({
  category,
  onSave,
}: {
  category: Category;
  onSave: (patch: { subcategory?: string; budget?: number }) => Promise<void>;
}) {
  const t = useT();
  const [subcategory, setSubcategory] = React.useState(category.subcategory);
  const [budget, setBudget] = React.useState(category.budget != null ? String(category.budget) : "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSubcategory(category.subcategory);
    setBudget(category.budget != null ? String(category.budget) : "");
  }, [category]);

  const trimmedSub = subcategory.trim();
  const budgetNum = budget.trim() === "" ? null : Number(budget);
  const budgetValid = budget.trim() === "" || !Number.isNaN(budgetNum);
  const dirty =
    (trimmedSub !== "" && trimmedSub !== category.subcategory) ||
    (budgetValid && budgetNum !== null && budgetNum !== category.budget);

  async function handleSave() {
    if (!dirty || !budgetValid) return;
    setSaving(true);
    setError(null);
    try {
      const patch: { subcategory?: string; budget?: number } = {};
      if (trimmedSub !== category.subcategory) patch.subcategory = trimmedSub;
      if (budgetNum !== null && budgetNum !== category.budget) patch.budget = budgetNum;
      await onSave(patch);
    } catch (err) {
      setError(errorMessage(err, t.categories.failedToSave));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 border-t border-border py-2 first:border-t-0">
      <div className="flex items-center gap-2">
        <Input
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="h-8 flex-1"
          disabled={saving}
        />
        <Input
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder={t.categories.budgetPlaceholder}
          inputMode="decimal"
          className="h-8 w-32"
          disabled={saving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={handleSave}
          disabled={saving || !dirty || !budgetValid}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
      {!budgetValid && <p className="text-xs text-destructive">{t.categories.budgetMustBeNumber}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Inline "+ Add subcategory" form shown at the bottom of a main category's
// list -- toggled by a button rather than always visible, same pattern as
// MainCategoryName's edit toggle.
function AddSubcategoryForm({ onAdd }: { onAdd: (subcategory: string, budget?: number) => Promise<void> }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [subcategory, setSubcategory] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        {t.categories.addSubcategory}
      </button>
    );
  }

  async function handleAdd() {
    const trimmed = subcategory.trim();
    if (!trimmed) {
      setError(t.categories.nameRequired);
      return;
    }
    const budgetNum = budget.trim() === "" ? undefined : Number(budget);
    if (budgetNum !== undefined && Number.isNaN(budgetNum)) {
      setError(t.categories.budgetMustBeNumber);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd(trimmed, budgetNum);
      setSubcategory("");
      setBudget("");
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err, t.categories.failedToAdd));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          placeholder={t.categories.newSubcategoryPlaceholder}
          className="h-8 flex-1"
          disabled={saving}
        />
        <Input
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder={t.categories.budgetPlaceholder}
          inputMode="decimal"
          className="h-8 w-32"
          disabled={saving}
        />
        <Button size="sm" onClick={handleAdd} disabled={saving}>
          {t.categories.add}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          disabled={saving}
          onClick={() => {
            setOpen(false);
            setSubcategory("");
            setBudget("");
            setError(null);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Top-level "+ Add category" form for creating a brand-new main category.
// It only creates the group -- subcategories get added to it afterwards via
// AddSubcategoryForm, since a main category can't hold a budget on its own.
function AddMainCategoryForm({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="h-4 w-4" />
        {t.categories.addCategory}
      </Button>
    );
  }

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.categories.nameRequired);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdd(trimmed);
      setName("");
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err, t.categories.failedToAdd));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col gap-2 pt-4">
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={t.categories.newCategoryNamePlaceholder}
            className="h-8 flex-1"
            disabled={saving}
          />
          <Button size="sm" onClick={handleAdd} disabled={saving}>
            {t.categories.add}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            disabled={saving}
            onClick={() => {
              setOpen(false);
              setName("");
              setError(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

export default function Categories() {
  const t = useT();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [mainCategories, setMainCategories] = React.useState<MainCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    return Promise.all([api.categories.list(), api.mainCategories.list()])
      .then(([cats, mainCats]) => {
        setCategories(cats);
        setMainCategories(mainCats);
      })
      .catch((err) => setError(errorMessage(err, t.categories.failedToLoad)));
  }, []);

  React.useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const groups = React.useMemo(() => groupCategories(mainCategories, categories), [mainCategories, categories]);

  async function handleRenameMain(mainCategoryId: number, name: string) {
    await api.mainCategories.update(mainCategoryId, name);
    await load();
  }

  async function handleSaveSubcategory(id: number, patch: { subcategory?: string; budget?: number }) {
    if (patch.subcategory !== undefined) {
      await api.categories.update(id, { subcategory: patch.subcategory });
    }
    if (patch.budget !== undefined) {
      await api.categories.updateBudget(id, patch.budget);
    }
    await load();
  }

  async function handleAddSubcategory(mainCategoryId: number, subcategory: string, budget?: number) {
    await api.categories.create({ mainCategoryId, subcategory, budget });
    await load();
  }

  async function handleAddMainCategory(name: string) {
    await api.mainCategories.create(name);
    await load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.categories.title}</h1>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {groups.map((group) => {
          const Icon = getCategoryIcon(group.mainName);
          return (
            <Card key={group.mainCategoryId}>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <MainCategoryName
                  name={group.mainName}
                  onSave={(name) => handleRenameMain(group.mainCategoryId, name)}
                />
              </CardHeader>
              <CardContent className="pt-0">
                {group.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.categories.noSubcategoriesYet}</p>
                ) : (
                  group.items.map((c) => (
                    <SubcategoryRow key={c.id} category={c} onSave={(patch) => handleSaveSubcategory(c.id, patch)} />
                  ))
                )}
                <AddSubcategoryForm
                  onAdd={(subcategory, budget) => handleAddSubcategory(group.mainCategoryId, subcategory, budget)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AddMainCategoryForm onAdd={handleAddMainCategory} />
    </div>
  );
}
