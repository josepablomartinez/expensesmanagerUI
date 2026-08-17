import { NavLink, Outlet } from "react-router-dom";
import { ListChecks, Tags, BarChart3, Home, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const TOP_NAV_ITEMS = [
  { to: "/review", label: "Review", icon: ListChecks },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const BOTTOM_NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/search", label: "Search", icon: Search, end: false },
];

export function AppShell() {
  const { token, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="text-sm font-semibold tracking-tight">
            Expenses
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
          <div>{token && <Button variant="ghost" size="sm" onClick={logout}>Log out</Button>}</div>
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
            aria-label="Add expense"
            className="flex flex-col items-center gap-0.5 rounded-full bg-primary p-3 text-primary-foreground shadow-md transition-transform hover:scale-105 -translate-y-3"
          >
            <Plus className="h-5 w-5" />
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
