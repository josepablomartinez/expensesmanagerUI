import { Copy, Moon, ShieldAlert, TrendingUp, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

// expenses.flag_type values come from the API's insert triggers:
// 'duplicate' (fn_flag_duplicate_expense) and 'suspicious_amount' /
// 'suspicious_hour' (fn_flag_suspicious_expense). Anything else containing
// "suspicious" falls back to the generic label.
export type FlagKind = "duplicate" | "amount" | "hour" | "suspicious";

export function flagKind(flagType: string): FlagKind {
  const type = flagType.toLowerCase();
  if (type === "suspicious_amount") return "amount";
  if (type === "suspicious_hour") return "hour";
  if (type.includes("suspicious")) return "suspicious";
  return "duplicate";
}

export const flagIcons: Record<FlagKind, LucideIcon> = {
  duplicate: Copy,
  amount: TrendingUp,
  hour: Moon,
  suspicious: ShieldAlert,
};

export function flagLabel(kind: FlagKind, t: Dictionary) {
  switch (kind) {
    case "amount":
      return t.common.unusualAmount;
    case "hour":
      return t.common.unusualHour;
    case "suspicious":
      return t.common.suspiciousExpense;
    default:
      return t.common.possibleDuplicate;
  }
}
