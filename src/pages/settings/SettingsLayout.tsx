import { NavLink, Outlet } from "react-router-dom";
import { SlidersHorizontal, CreditCard, Tags, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/language";

export default function SettingsLayout() {
  const t = useT();
  const SETTINGS_TABS = [
    { to: "/settings/basic", label: t.settingsLayout.tabs.basic, icon: SlidersHorizontal },
    { to: "/settings/credit-cards", label: t.settingsLayout.tabs.creditCards, icon: CreditCard },
    { to: "/settings/categories", label: t.settingsLayout.tabs.categories, icon: Tags },
    { to: "/settings/advanced", label: t.settingsLayout.tabs.advanced, icon: Settings2 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t.settings.title}</h1>

      <nav className="flex w-fit items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
        {SETTINGS_TABS.map((tab) => (
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
