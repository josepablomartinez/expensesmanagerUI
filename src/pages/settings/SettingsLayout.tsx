import { NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight, CreditCard, Settings2, SlidersHorizontal, Tags } from "lucide-react";
import SettingsBasic from "@/pages/settings/Basic";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";

function useSettingsSections() {
  const t = useT();
  return [
    {
      to: "/settings/basic",
      label: t.settingsLayout.tabs.basic,
      description: t.settingsLayout.descriptions.basic,
      icon: SlidersHorizontal,
    },
    {
      to: "/settings/credit-cards",
      label: t.settingsLayout.tabs.creditCards,
      description: t.settingsLayout.descriptions.creditCards,
      icon: CreditCard,
    },
    {
      to: "/settings/categories",
      label: t.settingsLayout.tabs.categories,
      description: t.settingsLayout.descriptions.categories,
      icon: Tags,
    },
    {
      to: "/settings/advanced",
      label: t.settingsLayout.tabs.advanced,
      description: t.settingsLayout.descriptions.advanced,
      icon: Settings2,
    },
  ];
}

export function SettingsIndex() {
  const t = useT();
  const sections = useSettingsSections();

  return (
    <>
      <nav aria-label={t.settingsLayout.sectionsLabel} className="overflow-hidden rounded-panel border border-border bg-card md:hidden">
        {sections.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className="flex min-h-20 items-center gap-3 border-t border-border px-4 text-left first:border-t-0 hover:bg-accent"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <section.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-medium text-foreground">{section.label}</span>
              <span className="text-xs leading-relaxed text-muted-foreground">{section.description}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

      <div className="hidden md:block">
        <SettingsBasic />
      </div>
    </>
  );
}

export default function SettingsLayout() {
  const t = useT();
  const location = useLocation();
  const sections = useSettingsSections();
  const atIndex = location.pathname === "/settings" || location.pathname === "/settings/";
  const current = sections.find((section) => location.pathname === section.to) ?? sections[0];

  return (
    <div className="md:grid md:grid-cols-[210px_minmax(0,1fr)] md:items-start md:gap-7">
      <aside className="sticky top-6 hidden flex-col gap-1 md:flex">
        <h1 className="mb-3 text-xl font-semibold">{t.settings.title}</h1>
        <nav aria-label={t.settingsLayout.sectionsLabel} className="flex flex-col gap-1">
          {sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  isActive || (atIndex && section.to === "/settings/basic")
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <section.icon className="h-4 w-4" aria-hidden="true" />
              {section.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="min-w-0">
        {atIndex ? (
          <h1 className="mb-5 text-xl font-semibold md:hidden">{t.settings.title}</h1>
        ) : (
          <div className="mb-5 flex items-start gap-2 md:hidden">
            <NavLink
              to="/settings"
              aria-label={t.settingsLayout.backToSettings}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </NavLink>
            <div className="pt-0.5">
              <h1 className="text-xl font-semibold">{current.label}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
            </div>
          </div>
        )}

        <div className="mb-5 hidden md:block">
          <h2 className="text-xl font-semibold">{current.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{current.description}</p>
        </div>

        <Outlet />
      </section>
    </div>
  );
}
