import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/language";
import { cn } from "@/lib/utils";

interface ExpenseDialogProps {
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ExpenseDialog({ title, description, onClose, children, className }: ExpenseDialogProps) {
  const t = useT();
  const titleId = React.useId();
  const dialogRef = React.useRef<HTMLDivElement>(null);
  // Capture the trigger before a child's autoFocus runs during commit.
  const triggerRef = React.useRef(document.activeElement as HTMLElement | null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  React.useLayoutEffect(() => {
    const previouslyFocused = triggerRef.current;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
    )).filter((element) => element.getClientRects().length > 0);
    if (!dialog.contains(document.activeElement)) (focusable()[0] ?? dialog).focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    const keepFocusInside = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) (focusable()[0] ?? dialog).focus();
    };
    document.addEventListener("keydown", trapFocus);
    document.addEventListener("focusin", keepFocusInside);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      document.removeEventListener("focusin", keepFocusInside);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <Card ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={cn("max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-panel shadow-xl", className)}>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle id={titleId} className="text-base text-foreground">
              {title}
            </CardTitle>
            {description}
          </div>
          <Button type="button" size="icon" variant="ghost" className="-mr-2 -mt-2 h-8 w-8" onClick={onClose} aria-label={t.common.close}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
