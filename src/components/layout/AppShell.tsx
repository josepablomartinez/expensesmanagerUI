import * as React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Home,
  ListChecks,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { MiHarinaLogo } from "@/components/brand/MiHarinaLogo";
import { Button } from "@/components/ui/button";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { api } from "@/lib/api";
import { useAlerts } from "@/lib/alerts";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";
import { useExpenseEvents } from "@/lib/events";
import { useT } from "@/lib/language";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, toggleCurrency } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const { unreadCount } = useAlerts();
  const [pendingCount, setPendingCount] = React.useState<number | null>(null);
  const [alertsOpen, setAlertsOpen] = React.useState(false);

  const loadPendingCount = React.useCallback(() => {
    api.expenses
      .review()
      .then((expenses) => setPendingCount(expenses.length))
      .catch(() => setPendingCount(null));
  }, []);

  React.useEffect(() => {
    loadPendingCount();
  }, [loadPendingCount, location.pathname]);

  React.useEffect(() => {
    setAlertsOpen(false);
  }, [location.pathname]);

  useExpenseEvents(loadPendingCount);

  const desktopNavItems = [
    { to: "/review", label: t.nav.review, icon: ListChecks },
    { to: "/search", label: t.nav.search, icon: Search },
    { to: "/reports", label: t.nav.reports, icon: BarChart3 },
  ];

  const mobileNavItems = [
    { to: "/", label: t.nav.home, icon: Home, end: true },
    { to: "/review", label: t.nav.review, icon: ListChecks },
    { to: "/add", label: t.nav.addExpense, icon: Plus, add: true },
    { to: "/search", label: t.nav.search, icon: Search },
    { to: "/reports", label: t.nav.reports, icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card text-card-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-3 sm:px-4 md:px-6">
          <NavLink
            to="/"
            end
            aria-label={t.nav.brand}
            className="rounded-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MiHarinaLogo className="hidden md:inline-flex" />
            <MiHarinaLogo compact className="md:hidden" />
          </NavLink>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {desktopNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
                {item.to === "/review" && pendingCount !== null && pendingCount > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[11px] font-medium leading-none text-[#17231f]">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <NavLink
              to="/add"
              className={({ isActive }) =>
                cn(
                  "mr-1 hidden min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium md:inline-flex",
                  isActive ? "bg-secondary text-secondary-foreground" : "bg-card hover:bg-accent",
                )
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t.nav.addExpense}
            </NavLink>

            <Button
              variant="ghost"
              size="sm"
              aria-label={currency === "CRC" ? t.nav.switchToUsd : t.nav.switchToCrc}
              onClick={toggleCurrency}
              className="min-w-9 bg-muted px-2 text-sm font-medium"
            >
              {currency === "CRC" ? "₡" : "$"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "dark" ? t.nav.switchToLight : t.nav.switchToDark}
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            <div className="relative" data-alerts-control>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t.nav.alerts}
                aria-haspopup="dialog"
                aria-expanded={alertsOpen}
                className="relative h-9 w-9"
                onClick={() => {
                  if (window.matchMedia("(min-width: 768px)").matches) {
                    setAlertsOpen((open) => !open);
                  } else {
                    navigate("/alerts");
                  }
                }}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount !== null && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-medium leading-4 text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
              {alertsOpen && <AlertsPanel onClose={() => setAlertsOpen(false)} />}
            </div>
            <NavLink
              to="/settings"
              aria-label={t.nav.settings}
              className={({ isActive }) =>
                cn(
                  "flex h-9 w-9 items-center justify-center rounded-md",
                  isActive ? "bg-secondary text-secondary-foreground" : "hover:bg-accent",
                )
              }
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </NavLink>
            {token && (
              <Button variant="ghost" size="sm" onClick={logout} className="hidden lg:inline-flex">
                {t.nav.logOut}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1040px] px-4 py-6 pb-24 sm:px-6 md:py-7 md:pb-8">
        <Outlet />
      </main>

      <nav
        aria-label="Mobile primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <span
                className={cn(
                  "relative flex h-6 min-w-6 items-center justify-center",
                  item.add && "rounded-full bg-secondary px-1.5 text-secondary-foreground",
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.to === "/review" && pendingCount !== null && pendingCount > 0 && (
                  <span className="absolute -right-2 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-medium leading-4 text-[#17231f]">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate">{item.add ? item.label.replace(/ expense| gasto/i, "") : item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
