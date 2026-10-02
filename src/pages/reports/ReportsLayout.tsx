import * as React from "react";
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { PieChart, TrendingDown, LineChart, CalendarClock, ChartSpline, FileText, Scale, CreditCard, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";

interface ReportsContext {
  includeProjects: boolean;
}

// The "Include projects" toggle, shared by every report tab so switching tabs
// keeps the choice. Off on each visit -- project spending (weddings, trips)
// stays out of budgets and averages unless asked for.
export function useIncludeProjects() {
  return useOutletContext<ReportsContext>().includeProjects;
}

export default function ReportsLayout() {
  const t = useT();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const [includeProjects, setIncludeProjects] = React.useState(false);
  const [hasProjects, setHasProjects] = React.useState(false);

  // No projects, nothing to include -- keep the toggle out of the way.
  React.useEffect(() => {
    api.projects
      .list()
      .then((list) => setHasProjects(list.length > 0))
      .catch(() => {});
  }, []);

  // Charts' card-cycle view always counts project charges (they're on the
  // statement), so the toggle would do nothing there.
  const showToggle = hasProjects && !pathname.startsWith("/reports/charts");
  const groups = [
    { label: t.reportsLayout.groups.budget, items: [
      { to: "/reports/budget-vs-actual", label: t.reportsLayout.tabs.budgetVsActual, icon: PieChart },
      { to: "/reports/burndown", label: t.reportsLayout.tabs.burndown, icon: TrendingDown },
    ] },
    { label: t.reportsLayout.groups.cashFlow, items: [
      { to: "/reports/income-vs-expenses", label: t.reportsLayout.tabs.incomeVsExpenses, icon: Scale },
      { to: "/reports/payment-window", label: t.reportsLayout.tabs.paymentWindow, icon: CalendarClock },
      { to: "/reports/charts?view=credit-card", label: t.charts.creditCard.title, icon: CreditCard },
    ] },
    { label: t.reportsLayout.groups.spending, items: [
      { to: "/reports/subcategories-by-month", label: t.reportsLayout.tabs.subcategoriesByMonth, icon: LineChart },
      { to: "/reports/charts?view=hour-profile", label: t.charts.hourProfile.title, icon: Clock },
      { to: "/reports/category-report", label: t.categoryReport.link, icon: FileText },
    ] },
    { label: t.reportsLayout.groups.exchangeRates, items: [
      { to: "/reports/charts?view=exchange-rate", label: t.charts.exchangeRate.title, icon: ChartSpline },
    ] },
  ];
  const requestedChart = new URLSearchParams(search).get("view");
  const chartView = hash === "#hour-profile" ? "hour-profile"
    : requestedChart === "credit-card" || requestedChart === "hour-profile" ? requestedChart : "exchange-rate";
  const activeTo = pathname === "/reports/charts" ? pathname + "?view=" + chartView : pathname;

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
            {groups.map((group) => (
              <optgroup key={group.label} label={group.label} className="bg-background text-foreground">
                {group.items.map((item) => <option key={item.to} value={item.to}>{item.label}</option>)}
              </optgroup>
            ))}
          </Select>
          <div className="hidden space-y-5 rounded-xl border border-border bg-card p-3 lg:block">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link key={item.to} to={item.to} aria-current={activeTo === item.to ? "page" : undefined}
                      className={cn("flex min-h-10 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        activeTo === item.to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
        </div>
      </div>
    </div>
  );
}
