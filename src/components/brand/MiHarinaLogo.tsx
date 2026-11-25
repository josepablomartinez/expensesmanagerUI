import { cn } from "@/lib/utils";
import christmasBagMark from "@/assets/branding/miharina-christmas.png";

interface MiHarinaLogoProps {
  compact?: boolean;
  className?: string;
}

export function MiHarinaLogo({ compact = false, className }: MiHarinaLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap sm:gap-2", className)}>
      <span className="inline-flex h-9 w-9 shrink-0 sm:h-10 sm:w-10 md:h-11 md:w-11">
        <img
          src={christmasBagMark}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="h-full w-full object-contain"
        />
      </span>
      {!compact && (
        <span className="text-base font-semibold leading-none tracking-tight sm:text-lg md:text-xl">
          <span className="text-[#2F6B57] dark:text-[#8FBCA8]">Mi</span>
          <span className="text-[#0F3D32] dark:text-[#F5F0E5]">Harina</span>
        </span>
      )}
      <span className="sr-only">MiHarina</span>
    </span>
  );
}
