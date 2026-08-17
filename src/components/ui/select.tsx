import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        // The dropdown popup is native chrome -- bg-transparent above only
        // affects the closed control. Without an explicit background/color
        // here, Chromium renders the open popup with a white background but
        // inherits our light foreground text, making options unreadable
        // until hovered.
        "[&>option]:bg-background [&>option]:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
