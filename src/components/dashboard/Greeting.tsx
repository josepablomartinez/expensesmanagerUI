import { getGreeting } from "@/lib/greeting";
import { useLanguage } from "@/lib/language";

export function Greeting({ name }: { name?: string | null }) {
  const { language, t } = useLanguage();
  const { text, icon: Icon } = getGreeting(t.dashboard.greeting);
  const date = new Intl.DateTimeFormat(language === "es" ? "es-CR" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="relative z-10 flex min-w-0 items-center gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-logo text-gold shadow-sm sm:h-14 sm:w-14">
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
          {text}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-1 text-sm capitalize text-brand-hero-foreground/80">{date}</p>
      </div>
    </div>
  );
}
