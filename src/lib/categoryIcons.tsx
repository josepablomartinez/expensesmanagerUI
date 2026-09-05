import type { ComponentType, SVGProps } from "react";
import { Tag } from "lucide-react";
import artwork from "../../docs/ui/Iconografia.png";

// Display each original artwork tile from the approved sheet. The image is
// bundled locally and its colors/proportions are preserved in both themes.
function categoryArtwork(x: number, y: number): ComponentType<SVGProps<SVGSVGElement>> {
  return function CategoryArtwork(props) {
    return <svg {...props} viewBox={`${x + 11} ${y + 6} 198 198`} preserveAspectRatio="xMidYMid meet">
      <image href={artwork} width="1536" height="1024" />
    </svg>;
  };
}

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Apto2: categoryArtwork(72, 172),
  PagosExtra: categoryArtwork(357, 172),
  Personal: categoryArtwork(646, 172),
  Mama: categoryArtwork(935, 172),
  Alimentacion: categoryArtwork(1221, 172),
  Transporte: categoryArtwork(72, 458),
  Otros: categoryArtwork(357, 458),
  Subscripciones: categoryArtwork(646, 458),
  Salud: categoryArtwork(935, 458),
  Inversiones: categoryArtwork(1221, 458),
  Navidad: categoryArtwork(72, 743),
  Viajes: categoryArtwork(357, 743),
  Apto14: categoryArtwork(646, 743),
  Mascotas: categoryArtwork(935, 743),
};

export function mainCategoryOf(categoryName?: string | null): string | null {
  if (!categoryName) return null;
  return categoryName.split("/")[0] ?? null;
}

export function getCategoryIcon(mainCategory?: string | null): ComponentType<SVGProps<SVGSVGElement>> {
  if (!mainCategory) return Tag;
  return ICONS[mainCategory] ?? Tag;
}
