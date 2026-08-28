import { Sun, Sunset, Moon, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export interface Greeting {
  text: string;
  icon: LucideIcon;
}

// Morning 5am-12pm, afternoon 12pm-6pm, night 6pm-5am (local time).
export function getGreeting(g: Dictionary["dashboard"]["greeting"], now: Date = new Date()): Greeting {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return { text: g.morning, icon: Sun };
  if (hour >= 12 && hour < 18) return { text: g.afternoon, icon: Sunset };
  return { text: g.night, icon: Moon };
}
