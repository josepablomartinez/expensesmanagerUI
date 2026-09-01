import * as React from "react";
import { api, type Bank, type Category } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CreditCardsSection } from "@/components/settings/CreditCardsSection";
import { useCurrency } from "@/lib/currency";
import { useLanguage } from "@/lib/language";

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
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const [favoriteBanks, setFavoriteBanks] = React.useState<Set<string>>(new Set());
  const [favoriteCategoryIds, setFavoriteCategoryIds] = React.useState<Set<number>>(new Set());
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [exchangeRateSource, setExchangeRateSource] = React.useState("average");
  const [exchangeRateBankId, setExchangeRateBankId] = React.useState<number | null>(null);
  const [creditCardExpenseDate, setCreditCardExpenseDate] = React.useState("event");
  const [selectedGroupName, setSelectedGroupName] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([api.settings.get(), api.categories.list(), api.banks.list()])
      .then(([settings, cats, bankList]) => {
        setFavoriteBanks(new Set(settings.favorite_banks));
        setFavoriteCategoryIds(new Set(settings.favorite_category_ids));
        setFirstName(settings.first_name ?? "");
        setLastName(settings.last_name ?? "");
        setEmail(settings.email ?? "");
        setExchangeRateSource(settings.exchange_rate_source);
        setExchangeRateBankId(settings.exchange_rate_bank_id);
        setCreditCardExpenseDate(settings.credit_card_expense_date);
        setCategories(cats);
        setBanks(bankList);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t.settings.failedToLoad))
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
        favorite_banks: Array.from(favoriteBanks),
        favorite_category_ids: Array.from(favoriteCategoryIds),
        first_name: firstName.trim() === "" ? null : firstName.trim(),
        last_name: lastName.trim() === "" ? null : lastName.trim(),
        email: email.trim() === "" ? null : email.trim(),
        exchange_rate_source: exchangeRateSource,
        exchange_rate_bank_id: exchangeRateSource === "bank" ? exchangeRateBankId : undefined,
        credit_card_expense_date: creditCardExpenseDate,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settings.failedToSave);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t.settings.title}</h1>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.currencyDisplay}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value === "USD" ? "USD" : "CRC")}
            className="w-40"
          >
            <option value="CRC">CRC (₡)</option>
            <option value="USD">USD ($)</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.language}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value === "es" ? "es" : "en")}
            className="w-40"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.favoriteCategories}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.settings.noCategoriesYet}</p>
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
          <CardTitle>{t.settings.favoriteBanks}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {banks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.settings.noBanksYet}</p>
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

      <CreditCardsSection banks={banks} />

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.personalInfo}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="first_name">
                {t.settings.firstName}
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
                {t.settings.lastName}
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
              {t.settings.email}
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

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.advanced}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="exchange_rate_source">
              {t.settings.exchangeRateSource}
            </label>
            <p className="text-xs text-muted-foreground">{t.settings.exchangeRateSourceHelp}</p>
            <Select
              id="exchange_rate_source"
              value={exchangeRateSource}
              onChange={(e) => {
                setSaved(false);
                setExchangeRateSource(e.target.value);
              }}
              className="w-56"
            >
              <option value="average">{t.settings.exchangeRateSourceAverage}</option>
              <option value="bank">{t.settings.exchangeRateSourceBank}</option>
            </Select>
          </div>
          {exchangeRateSource === "bank" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="exchange_rate_bank_id">
                {t.settings.exchangeRateBank}
              </label>
              <Select
                id="exchange_rate_bank_id"
                value={exchangeRateBankId ?? ""}
                onChange={(e) => {
                  setSaved(false);
                  setExchangeRateBankId(e.target.value === "" ? null : Number(e.target.value));
                }}
                className="w-56"
              >
                <option value="" disabled>
                  {t.settings.exchangeRateBank}
                </option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="credit_card_expense_date">
              {t.settings.creditCardExpenseDate}
            </label>
            <p className="text-xs text-muted-foreground">{t.settings.creditCardExpenseDateHelp}</p>
            <Select
              id="credit_card_expense_date"
              value={creditCardExpenseDate}
              onChange={(e) => {
                setSaved(false);
                setCreditCardExpenseDate(e.target.value);
              }}
              className="w-56"
            >
              <option value="event">{t.settings.creditCardExpenseDateEvent}</option>
              <option value="due">{t.settings.creditCardExpenseDateDue}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t.common.saving : t.common.save}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">{t.common.saved}</span>}
      </div>
    </div>
  );
}
