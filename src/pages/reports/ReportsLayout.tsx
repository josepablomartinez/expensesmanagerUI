import { NavLink, Outlet } from "react-router-dom";
import { PieChart, TrendingDown, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";

export default function ReportsLayout() {
  const t = useT();
  const REPORT_TABS = [
    { to: "/reports/budget-vs-actual", label: t.reportsLayout.tabs.budgetVsActual, icon: PieChart },
    { to: "/reports/burndown", label: t.reportsLayout.tabs.burndown, icon: TrendingDown },
    { to: "/reports/subcategories-by-month", label: t.reportsLayout.tabs.subcategoriesByMonth, icon: LineChart },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t.reportsLayout.title}</h1>
        <p className="text-sm text-muted-foreground">{t.reportsLayout.subtitle}</p>
      </header>

      <nav
        aria-label={t.reportsLayout.sectionsLabel}
        className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-secondary/40 p-1"
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

      <Outlet />
    </div>
  );
}
