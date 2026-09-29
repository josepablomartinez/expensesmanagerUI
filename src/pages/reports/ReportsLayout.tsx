import * as React from "react";
import { NavLink, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { PieChart, TrendingDown, LineChart, CalendarClock, ChartSpline } from "lucide-react";
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
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
  const { pathname } = useLocation();
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
  const REPORT_TABS = [
    { to: "/reports/budget-vs-actual", label: t.reportsLayout.tabs.budgetVsActual, icon: PieChart },
    { to: "/reports/payment-window", label: t.reportsLayout.tabs.paymentWindow, icon: CalendarClock },
    { to: "/reports/burndown", label: t.reportsLayout.tabs.burndown, icon: TrendingDown },
    { to: "/reports/subcategories-by-month", label: t.reportsLayout.tabs.subcategoriesByMonth, icon: LineChart },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t.reportsLayout.title}</h1>
          <p className="text-sm text-muted-foreground">{t.reportsLayout.subtitle}</p>
        </div>
        {/* Charts is a side section, deliberately kept out of the tab bar. */}
        <NavLink
          to="/reports/charts"
          className={({ isActive }) =>
            cn(
              "flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium",
              isActive ? "bg-secondary text-secondary-foreground" : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )
          }
        >
          <ChartSpline className="h-4 w-4" aria-hidden="true" />
          {t.charts.link}
        </NavLink>
      </header>

      <nav
        aria-label={t.reportsLayout.sectionsLabel}
        className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-lg border border-border bg-secondary/40 p-1"
      >
        {REPORT_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex min-h-11 min-w-0 flex-col items-center justify-center gap-1.5 rounded-md px-2 py-2 text-center text-xs font-medium transition-colors sm:flex-row sm:px-4 sm:text-sm",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <tab.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      {showToggle && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
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
  );
}
