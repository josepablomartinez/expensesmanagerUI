import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/language";

interface ExpenseDialogProps {
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

export function ExpenseDialog({ title, description, onClose, children }: ExpenseDialogProps) {
  const t = useT();
  const titleId = React.useId();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <Card role="dialog" aria-modal="true" aria-labelledby={titleId} className="w-full max-w-sm rounded-panel shadow-xl">
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
