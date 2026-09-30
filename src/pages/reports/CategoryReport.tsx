import * as React from "react";
import { Printer } from "lucide-react";
import { api, type Category, type CategorySummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CategoryReportSheet } from "@/components/reports/CategoryReportSheet";
import { localISODate, monthRange } from "@/lib/date";
import { useT } from "@/lib/language";
import { useIncludeProjects } from "@/pages/reports/ReportsLayout";

interface MainGroup {
  id: number;
  name: string;
  subs: Category[];
}

function groupCategories(categories: Category[]): MainGroup[] {
  const map = new Map<number, MainGroup>();
  for (const c of categories) {
    const g = map.get(c.main_category_id) ?? { id: c.main_category_id, name: c.category, subs: [] };
    g.subs.push(c);
    map.set(c.main_category_id, g);
  }
  const groups = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  for (const g of groups) g.subs.sort((a, b) => a.subcategory.localeCompare(b.subcategory));
  return groups;
}

// Checkbox that can show the "some children selected" state.
function GroupCheckbox({ checked, indeterminate, onChange, label }: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  label: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className="flex min-h-9 items-center gap-2 text-sm font-medium">
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}

export default function CategoryReport() {
  const t = useT();
  const includeProjects = useIncludeProjects();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);
  const [from, setFrom] = React.useState(() => monthRange(0).from);
  const [to, setTo] = React.useState(() => monthRange(0).to);
  const [name, setName] = React.useState("");
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [report, setReport] = React.useState<CategorySummary | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Disabled subcategories stay listed: a report on a past period may need them.
  React.useEffect(() => {
    api.categories
      .list({ includeDisabled: true })
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : t.categoryReport.failedToLoad))
      .finally(() => setLoadingCategories(false));
  }, [t.categoryReport.failedToLoad]);

  const groups = React.useMemo(() => groupCategories(categories), [categories]);
  const validRange = from !== "" && to !== "" && from <= to;
  const ids = React.useMemo(() => Array.from(selected).sort((a, b) => a - b), [selected]);

  React.useEffect(() => {
    if (!validRange || ids.length === 0) {
      setReport(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.reports
      .categorySummary(from, to, ids, includeProjects)
      .then((r) => !cancelled && setReport(r))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : t.categoryReport.failedToLoad))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [from, to, ids, validRange, includeProjects, t.categoryReport.failedToLoad]);

  // Browsers default the saved PDF's file name to the page title, so use the
  // report name for the duration of the print.
  React.useEffect(() => {
    const original = document.title;
    const before = () => {
      if (name.trim()) document.title = name.trim();
    };
    const after = () => {
      document.title = original;
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
      document.title = original;
    };
  }, [name]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(g: MainGroup) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = g.subs.every((s) => next.has(s.id));
      for (const s of g.subs) {
        if (allOn) next.delete(s.id);
        else next.add(s.id);
      }
      return next;
    });
  }

  function setPreset(range: { from: string; to: string }) {
    setFrom(range.from);
    setTo(range.to);
  }

  const year = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-4">
      <div className="print:hidden">
        <h2 className="text-xl font-semibold">{t.categoryReport.title}</h2>
        <p className="text-sm text-muted-foreground">{t.categoryReport.description}</p>
      </div>

      <Card className="print:hidden">
        <CardContent className="flex flex-col gap-4 pt-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            <span>
              {t.categoryReport.name} <span className="font-normal">({t.categoryReport.optional})</span>
            </span>
            <Input
              value={name}
              maxLength={80}
              placeholder={t.categoryReport.namePlaceholder}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              {t.categoryReport.from}
              <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              {t.categoryReport.to}
              <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPreset(monthRange(0))}>
                {t.categoryReport.thisMonth}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreset(monthRange(1))}>
                {t.categoryReport.lastMonth}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreset({ from: `${year}-01-01`, to: localISODate(new Date()) })}
              >
                {t.categoryReport.thisYear}
              </Button>
            </div>
          </div>
          {!validRange && from !== "" && to !== "" && (
            <p role="alert" className="text-sm text-destructive">{t.categoryReport.invalidRange}</p>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {t.categoryReport.categories}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {t.categoryReport.selectedCount(selected.size)}
                </span>
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set(categories.filter((c) => !c.disabled_at).map((c) => c.id)))}>
                  {t.categoryReport.selectAll}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  {t.categoryReport.clear}
                </Button>
              </div>
            </div>
            {loadingCategories ? (
              <p className="text-sm text-muted-foreground">{t.common.loading}</p>
            ) : (
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((g) => {
                  const on = g.subs.filter((s) => selected.has(s.id)).length;
                  return (
                    <fieldset key={g.id} className="min-w-0 rounded-md border border-border px-3 py-1">
                      <GroupCheckbox
                        checked={on === g.subs.length}
                        indeterminate={on > 0 && on < g.subs.length}
                        onChange={() => toggleGroup(g)}
                        label={g.name}
                      />
                      <div className="ml-6 flex flex-col">
                        {g.subs.map((s) => (
                          <label key={s.id} className="flex min-h-8 items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selected.has(s.id)}
                              onChange={() => toggle(s.id)}
                              className="h-4 w-4 accent-primary"
                            />
                            <span className={s.disabled_at ? "text-muted-foreground" : undefined}>
                              {s.subcategory}
                              {s.disabled_at && ` ${t.categoryReport.disabled}`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {ids.length === 0 ? (
        <p className="text-sm text-muted-foreground print:hidden">{t.categoryReport.pickSomething}</p>
      ) : !validRange ? null : error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : !report ? (
        loading && <p className="text-sm text-muted-foreground">{t.common.loading}</p>
      ) : (
        <>
          <div className="flex justify-end print:hidden">
            <Button type="button" onClick={() => window.print()} disabled={report.rows.length === 0}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t.categoryReport.print}
            </Button>
          </div>
          {report.rows.length === 0 ? (
            <Card><CardContent className="pt-4 text-sm text-muted-foreground">{t.categoryReport.noData}</CardContent></Card>
          ) : (
            <CategoryReportSheet report={report} name={name} />
          )}
        </>
      )}
    </div>
  );
}
