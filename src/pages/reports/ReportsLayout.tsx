import { NavLink, Outlet } from "react-router-dom";
import { PieChart, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const REPORT_TABS = [
  { to: "/reports/budget-vs-actual", label: "Budget vs actual", icon: PieChart },
  { to: "/reports/burndown", label: "Burn-down", icon: TrendingDown },
];

export default function ReportsLayout() {
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex w-fit items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
        {REPORT_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
