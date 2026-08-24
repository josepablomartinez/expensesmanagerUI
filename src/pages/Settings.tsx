import * as React from "react";
import { api, type Bank, type Category } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CategoryGroup {
  name: string;
  items: Category[];
}

function groupCategories(categories: Category[]): CategoryGroup[] {
  const map = new Map<string, Category[]>();
  for (const c of categories) {
    if (!map.has(c.category)) map.set(c.category, []);
    map.get(c.category)!.push(c);
  }
  return Array.from(map.entries())
    .map(([name, items]) => ({
      name,
      items: [...items].sort((a, b) => a.subcategory.localeCompare(b.subcategory)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export default function Settings() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const [displayCurrency, setDisplayCurrency] = React.useState("CRC");
  const [favoriteBanks, setFavoriteBanks] = React.useState<Set<string>>(new Set());
  const [favoriteCategoryIds, setFavoriteCategoryIds] = React.useState<Set<number>>(new Set());
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [selectedGroupName, setSelectedGroupName] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([api.settings.get(), api.categories.list(), api.banks.list()])
      .then(([settings, cats, bankList]) => {
        setDisplayCurrency(settings.display_currency);
        setFavoriteBanks(new Set(settings.favorite_banks));
        setFavoriteCategoryIds(new Set(settings.favorite_category_ids));
        setFirstName(settings.first_name ?? "");
        setLastName(settings.last_name ?? "");
        setEmail(settings.email ?? "");
        setCategories(cats);
        setBanks(bankList);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const groups = React.useMemo(() => groupCategories(categories), [categories]);

  React.useEffect(() => {
    setSelectedGroupName((current) => {
      if (current != null && groups.some((g) => g.name === current)) return current;
      return groups[0]?.name ?? null;
    });
  }, [groups]);

  const selectedGroup = groups.find((g) => g.name === selectedGroupName) ?? null;

  function toggleBank(code: string) {
    setSaved(false);
    setFavoriteBanks((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleCategory(id: number) {
    setSaved(false);
    setFavoriteCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.settings.update({
        display_currency: displayCurrency,
        favorite_banks: Array.from(favoriteBanks),
        favorite_category_ids: Array.from(favoriteCategoryIds),
        first_name: firstName.trim() === "" ? null : firstName.trim(),
        last_name: lastName.trim() === "" ? null : lastName.trim(),
        email: email.trim() === "" ? null : email.trim(),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Currency display</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Select
            value={displayCurrency}
            onChange={(e) => {
              setSaved(false);
              setDisplayCurrency(e.target.value);
            }}
            className="w-40"
          >
            <option value="CRC">CRC (₡)</option>
            <option value="USD">USD ($)</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Favorite categories</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <>
              <Select
                value={selectedGroupName ?? ""}
                onChange={(e) => setSelectedGroupName(e.target.value)}
                className="w-56"
              >
                {groups.map((group) => (
                  <option key={group.name} value={group.name}>
                    {group.name}
                    {group.items.some((c) => favoriteCategoryIds.has(c.id)) ? " ★" : ""}
                  </option>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                {selectedGroup?.items.map((c) => (
                  <ToggleChip key={c.id} active={favoriteCategoryIds.has(c.id)} onClick={() => toggleCategory(c.id)}>
                    {c.subcategory}
                  </ToggleChip>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Favorite banks</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {banks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No banks with exchange-rate history yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {banks.map((b) => (
                <ToggleChip key={b.id} active={favoriteBanks.has(b.code)} onClick={() => toggleBank(b.code)}>
                  {b.name}
                </ToggleChip>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal info</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="first_name">
                First name
              </label>
              <Input
                id="first_name"
                value={firstName}
                onChange={(e) => {
                  setSaved(false);
                  setFirstName(e.target.value);
                }}
                placeholder="Jose"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="last_name">
                Last name
              </label>
              <Input
                id="last_name"
                value={lastName}
                onChange={(e) => {
                  setSaved(false);
                  setLastName(e.target.value);
                }}
                placeholder="Martinez"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setSaved(false);
                setEmail(e.target.value);
              }}
              placeholder="you@example.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
      </div>
    </div>
  );
}
