import { getGreeting } from "@/lib/greeting";

export function Greeting({ name }: { name?: string | null }) {
  const { text, icon: Icon } = getGreeting();

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
