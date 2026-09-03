import { cn } from "@/lib/utils";

interface MiHarinaLogoProps {
  compact?: boolean;
  className?: string;
}

export function MiHarinaLogo({ compact = false, className }: MiHarinaLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 whitespace-nowrap", className)}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-panel bg-logo text-logo-foreground shadow-sm">
        <svg
          aria-hidden="true"
          className="h-7 w-7"
          viewBox="0 0 32 32"
          fill="none"
        >
          <path
            d="M11 9c1.6-3.1 3.3-3.7 5-2.1 1.7-1.6 3.4-1 5 2.1l-2.3 2.6h-5.4L11 9Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M12.4 11.6c-1.1 2.5-2.6 7.2-2.8 10.7-.1 2.7 2.1 4.1 6.4 4.1s6.5-1.4 6.4-4.1c-.2-3.5-1.7-8.2-2.8-10.7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.3 11.8c2.2-.2 4 .4 5.2 1.7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="16" cy="17.2" r="1.65" className="fill-gold" />
          <circle cx="16" cy="22.3" r="1.65" className="fill-gold" />
        </svg>
      </span>
      {!compact && <span className="text-lg font-medium tracking-tight">MiHarina</span>}
      <span className="sr-only">MiHarina</span>
    </span>
  );
}
