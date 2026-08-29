import { NavLink, Outlet } from "react-router-dom";
import { ListChecks, BarChart3, Home, Search, Plus, Wallet, Settings, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useCurrency } from "@/lib/currency";
import { useT } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { DuplicateAlertToast } from "@/components/DuplicateAlertToast";

export function AppShell() {
  const { token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, toggleCurrency } = useCurrency();
  const t = useT();

  const TOP_NAV_ITEMS = [
    { to: "/review", label: t.nav.review, icon: ListChecks },
    { to: "/reports", label: t.nav.reports, icon: BarChart3 },
  ];

  const BOTTOM_NAV_ITEMS = [
    { to: "/", label: t.nav.home, icon: Home, end: true },
    { to: "/search", label: t.nav.search, icon: Search, end: false },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DuplicateAlertToast />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-400 text-primary-foreground shadow-sm">
              <Wallet className="h-4 w-4" />
            </span>
            {t.nav.brand}
          </NavLink>
          <nav className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
            {TOP_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={currency === "CRC" ? t.nav.switchToUsd : t.nav.switchToCrc}
              onClick={toggleCurrency}
              className="font-semibold"
            >
              {currency === "CRC" ? "₡" : "$"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "dark" ? t.nav.switchToLight : t.nav.switchToDark}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NavLink
              to="/settings"
              aria-label={t.nav.settings}
              className={({ isActive }) =>
                cn(
                  "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <Settings className="h-4 w-4" />
            </NavLink>
            {token && (
              <Button variant="ghost" size="sm" onClick={logout}>
                {t.nav.logOut}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 pb-28">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-6 py-2">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/add"
            aria-label={t.nav.addExpense}
            className="flex flex-col items-center gap-0.5 rounded-full bg-primary p-3 text-primary-foreground shadow-md transition-transform hover:scale-105 -translate-y-3"
          >
            <Plus className="h-5 w-5" />
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
