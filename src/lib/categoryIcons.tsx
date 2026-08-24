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
  TrendingUp,
  Heart,
  Receipt,
  type LucideIcon,
} from "lucide-react";

// Keyed by the main `categories.category` value (db/functions.sql). Falls
// back to a generic tag icon for anything added later that isn't mapped yet.
const ICONS: Record<string, LucideIcon> = {
  Alimentacion: Utensils,
  Personal: User,
  Salud: HeartPulse,
  Subscripciones: Repeat2,
  Mascotas: PawPrint,
  Transporte: Car,
  Viajes: Plane,
  Navidad: Gift,
  Apto2: Building2,
  Apto14: Building2,
  Otros: MoreHorizontal,
  Inversiones: TrendingUp,
  Mama: Heart,
  PagosExtra: Receipt,
};

export function mainCategoryOf(categoryName?: string | null): string | null {
  if (!categoryName) return null;
  return categoryName.split("/")[0] ?? null;
}

export function getCategoryIcon(mainCategory?: string | null): LucideIcon {
  if (!mainCategory) return Tag;
  return ICONS[mainCategory] ?? Tag;
}
