import type { Expense } from "./api";

export interface CategoryOverride {
  id: number;
  categoryId: number;
}

// Splits the ids being approved into the ones whose row still carries a
// user-picked category that was never sent to the API. Bulk-approve only
// flips `reviewed` -- it has no category_id param -- so without this,
// "Approve Selected"/"Approve All" silently drop any category the user
// changed in a row's dropdown and keep the original system-proposed one.
export function resolveCategoryOverrides(
  expenses: Expense[],
  ids: number[],
  selections: Record<number, string>,
): CategoryOverride[] {
  const idSet = new Set(ids);
  const overrides: CategoryOverride[] = [];
  for (const expense of expenses) {
    if (!idSet.has(expense.id)) continue;
    const chosen = Number(selections[expense.id]);
    if (chosen > 0 && chosen !== expense.category_id) {
      overrides.push({ id: expense.id, categoryId: chosen });
    }
  }
  return overrides;
}

export interface MerchantRuleRequest {
  id: number;
  commercePattern: string;
  categoryId: number;
}

// Mirrors confirmApprove's "always categorize this merchant" behavior for the
// bulk approve flow (approveIds) -- without this, checking that box on a row
// and then using "Approve Selected"/"Approve All" silently drops the
// merchant-rule request instead of creating it.
export function resolveMerchantRules(
  expenses: Expense[],
  ids: number[],
  selections: Record<number, string>,
  alwaysCategorize: Record<number, boolean>,
): MerchantRuleRequest[] {
  const idSet = new Set(ids);
  const rules: MerchantRuleRequest[] = [];
  for (const expense of expenses) {
    if (!idSet.has(expense.id)) continue;
    if (!alwaysCategorize[expense.id] || !expense.merchant) continue;
    const categoryId = Number(selections[expense.id]);
    if (categoryId > 0) {
      rules.push({ id: expense.id, commercePattern: expense.merchant, categoryId });
    }
  }
  return rules;
}
