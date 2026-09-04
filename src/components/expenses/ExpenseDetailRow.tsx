import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ExpenseDetailRow({
  icon,
  children,
  className,
}: {
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full items-start gap-2.5 text-sm", className)}>
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
