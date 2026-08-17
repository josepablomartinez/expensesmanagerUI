import {
  Utensils,
  User,
  HeartPulse,
  Repeat2,
  PawPrint,
  Car,
  Plane,
  Gift,
  Building2,
  MoreHorizontal,
  Tag,
  type LucideIcon,
} from "lucide-react";

// Keyed by the main `categories.category` value (db/functions.sql). Falls
// back to a generic tag icon for anything added later that isn't mapped yet.
const ICONS: Record<string, LucideIcon> = {
  Alimentacion: Utensils,
  Personal: User,
  Health: HeartPulse,
  Subscriptions: Repeat2,
  Mascotas: PawPrint,
  Transport: Car,
  Viajes: Plane,
  Navidad: Gift,
  Apto2: Building2,
  Apto14: Building2,
  Otros: MoreHorizontal,
};

export function mainCategoryOf(categoryName?: string | null): string | null {
  if (!categoryName) return null;
  return categoryName.split("/")[0] ?? null;
}

export function getCategoryIcon(mainCategory?: string | null): LucideIcon {
  if (!mainCategory) return Tag;
  return ICONS[mainCategory] ?? Tag;
}
