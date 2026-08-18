import type { BudgetVsActual } from "@/lib/api";

export interface MainCategoryGroup {
  mainCategoryId: number;
  mainName: string;
  subcategories: BudgetVsActual[];
}

// category_name comes back from fn_budget_vs_actual as "categoría/subcategoría".
export function splitCategoryName(name: string): { mainName: string; subName: string } {
  const [mainName, subName] = name.split("/");
  return { mainName: mainName ?? name, subName: subName ?? name };
}

export function groupByMainCategory(rows: BudgetVsActual[]): MainCategoryGroup[] {
  const groups = new Map<number, MainCategoryGroup>();
  for (const row of rows) {
    if (row.main_category_id == null) continue;
    const existing = groups.get(row.main_category_id);
    if (existing) {
      existing.subcategories.push(row);
    } else {
      groups.set(row.main_category_id, {
        mainCategoryId: row.main_category_id,
        mainName: splitCategoryName(row.category_name).mainName,
        subcategories: [row],
      });
    }
  }
  for (const group of groups.values()) {
    group.subcategories.sort((a, b) =>
      splitCategoryName(a.category_name).subName.localeCompare(splitCategoryName(b.category_name).subName),
    );
  }

  return Array.from(groups.values()).sort((a, b) => a.mainName.localeCompare(b.mainName));
}
