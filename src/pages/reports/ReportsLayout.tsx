import * as React from "react";
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";
import { getReports } from "@/pages/reports/reportRegistry";

interface ReportsContext {
  includeProjects: boolean;
}

// The "Include projects" toggle, shared by every report tab so switching tabs
// keeps the choice. Off on each visit -- project spending (weddings, trips)
// stays out of budgets and averages unless asked for.
export function useIncludeProjects() {
  return useOutletContext<ReportsContext>().includeProjects;
}

const linkClass = (active: boolean) =>
  cn("flex min-h-10 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground");

export default function ReportsLayout() {
  const t = useT();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const [includeProjects, setIncludeProjects] = React.useState(false);
  const [hasProjects, setHasProjects] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  // No projects, nothing to include -- keep the toggle out of the way.
  React.useEffect(() => {
    api.projects
      .list()
      .then((list) => setHasProjects(list.length > 0))
      .catch(() => {});
  }, []);

  const isHome = pathname === "/reports";
  // Charts' card-cycle view always counts project charges (they're on the
  // statement), so the toggle would do nothing there. Nor on the home page.
  const showToggle = hasProjects && !isHome && !pathname.startsWith("/reports/charts");

  const reports = getReports(t);
  const essentials = reports.filter((r) => r.tier === "essential");
  const more = reports.filter((r) => r.tier === "more");

  const requestedChart = new URLSearchParams(search).get("view");
  const chartView = hash === "#hour-profile" ? "hour-profile"
    : requestedChart === "credit-card" || requestedChart === "hour-profile" ? requestedChart : "exchange-rate";
  const activeTo = pathname === "/reports/charts" ? pathname + "?view=" + chartView : pathname;
  const current = reports.find((r) => r.to === activeTo);
  const related = current ? current.related.map((id) => reports.find((r) => r.id === id)!) : [];

  // Opening a report that lives under "More" unfolds it, so the menu never
  // hides where you are.
  const currentIsMore = current?.tier === "more";
  React.useEffect(() => {
    if (currentIsMore) setMoreOpen(true);
  }, [currentIsMore]);

  const navItem = (item: { to: string; label: string; icon: React.ElementType }) => (
    <Link key={item.to} to={item.to} aria-current={activeTo === item.to ? "page" : undefined} className={linkClass(activeTo === item.to)}>
      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4 print:hidden">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t.reportsLayout.title}</h1>
          <p className="text-sm text-muted-foreground">{t.reportsLayout.subtitle}</p>
        </div>
      </header>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] print:block">
        <nav aria-label={t.reportsLayout.sectionsLabel} className="print:hidden">
          <Select aria-label={t.reportsLayout.sectionsLabel} value={activeTo}
            onChange={(event) => navigate(event.target.value)} className="w-full lg:hidden">
            <option value="/reports">{t.reportsLayout.overview}</option>
            <optgroup label={t.reportsLayout.groups.essentials} className="bg-background text-foreground">
              {essentials.map((item) => <option key={item.to} value={item.to}>{item.label}</option>)}
            </optgroup>
            <optgroup label={t.reportsLayout.groups.more} className="bg-background text-foreground">
              {more.map((item) => <option key={item.to} value={item.to}>{item.label}</option>)}
            </optgroup>
          </Select>
          <div className="hidden space-y-5 rounded-xl border border-border bg-card p-3 lg:block">
            {navItem({ to: "/reports", label: t.reportsLayout.overview, icon: LayoutGrid })}
            <div>
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.reportsLayout.groups.essentials}</p>
              <div className="space-y-1">{essentials.map(navItem)}</div>
            </div>
            <div>
              <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}
                className="mb-2 flex w-full items-center justify-between rounded px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {t.reportsLayout.groups.more}
                <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} aria-hidden="true" />
              </button>
              {moreOpen && <div className="space-y-1">{more.map(navItem)}</div>}
            </div>
          </div>
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
      {showToggle && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 print:hidden">
          <div className="flex min-w-0 flex-col">
            <span id="reports-include-projects" className="text-sm font-medium">
              {t.reportsLayout.includeProjects}
            </span>
            <span className="text-xs text-muted-foreground">{t.reportsLayout.includeProjectsHelp}</span>
          </div>
          <Switch
            checked={includeProjects}
            onCheckedChange={setIncludeProjects}
            aria-labelledby="reports-include-projects"
          />
        </div>
      )}

      <Outlet context={{ includeProjects: includeProjects && showToggle } satisfies ReportsContext} />

      {related.length > 0 && (
        <section aria-labelledby="reports-related" className="flex flex-col gap-2 print:hidden">
          <h2 id="reports-related" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.reportsLayout.relatedTitle}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} to={r.to}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{r.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
        </div>
      </div>
    </div>
  );
}
