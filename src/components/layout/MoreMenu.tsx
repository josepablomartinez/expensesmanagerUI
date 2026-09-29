import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FolderOpen, LogOut, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";

// Header menu for everything that isn't a daily destination: occasional
// sections (Projects; Income once it exists goes next to it, above the
// divider) and the account items (Settings, Log out). Same place on desktop
// and mobile -- the bottom bar's five slots are all daily use.
export function MoreMenu() {
  const t = useT();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector<HTMLElement>("[aria-haspopup=menu]")?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
      if (items.length === 0) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === "ArrowDown" ? (current + 1) % items.length : (current - 1 + items.length) % items.length;
      items[next].focus();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex min-h-10 w-full items-center gap-2.5 rounded-md px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      isActive ? "bg-secondary font-medium text-secondary-foreground" : "hover:bg-accent hover:text-accent-foreground",
    );
  const sectionActive = pathname.startsWith("/projects") || pathname.startsWith("/settings");

  return (
    <div className="relative" ref={rootRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t.nav.more}
        title={t.nav.more}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={cn("h-9 w-9", sectionActive && "bg-secondary text-secondary-foreground")}
        onClick={() => setOpen((o) => !o)}
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </Button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t.nav.more}
          className="absolute right-0 top-11 z-50 flex w-56 flex-col gap-0.5 rounded-panel border border-border bg-card p-1.5 text-card-foreground shadow-xl"
        >
          <NavLink to="/projects" role="menuitem" className={itemClass}>
            <FolderOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t.nav.projects}
          </NavLink>
          <div role="separator" className="my-1 h-px bg-border" />
          <NavLink to="/settings" role="menuitem" className={itemClass}>
            <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t.nav.settings}
          </NavLink>
          {user && (
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className={itemClass({ isActive: false })}
            >
              <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {t.nav.logOut}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
