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
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold">
          {text}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-0.5 text-sm capitalize text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}
