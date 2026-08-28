import { getGreeting } from "@/lib/greeting";
import { useT } from "@/lib/language";

export function Greeting({ name }: { name?: string | null }) {
  const t = useT();
  const { text, icon: Icon } = getGreeting(t.dashboard.greeting);

  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h1 className="text-xl font-semibold">
        {text}
        {name ? `, ${name}` : ""}
      </h1>
    </div>
  );
}
