import { describe, expect, it } from "vitest";
import type { Expense } from "./api";
import { resolveCategoryOverrides, resolveMerchantRules } from "./reviewApprove";

function makeExpense(id: number, categoryId: number | null, merchant: string | null = "Test Merchant"): Expense {
  return {
    id,
    country: null,
    city: null,
    merchant,
    authorization: null,
    currency: "CRC",
    date: "2026-08-16",
    hour: null,
    amount: 1000,
    colones_amount: 1000,
    dollars_amount: 2,
    category_id: categoryId,
    confidence: 0.5,
    entity: "BAC",
    type: "CARD",
    motive: null,
    reviewed: false,
    credit_card_id: null,
    card_type: null,
    card_last4: null,
    flag_type: null,
    flag_reason: null,
    payment_date: "2026-08-16",
  };
}

describe("resolveCategoryOverrides", () => {
  it("reproduces the review-page bug: a changed category must not be silently dropped", () => {
    // Expense 154 starts proposed as category 32. The user picks 44 in the
    // row's dropdown and then hits "Approve Selected" -- before the fix,
    // that dropdown value never left the component, so bulk-approve alone
    // would save it back as 32.
    const expenses = [makeExpense(154, 32)];
    const selections = { 154: "44" };

    const overrides = resolveCategoryOverrides(expenses, [154], selections);

    expect(overrides).toEqual([{ id: 154, categoryId: 44 }]);
  });

  it("skips rows where the user did not change the proposed category", () => {
    const expenses = [makeExpense(80, 10)];
    const selections = { 80: "10" };

    expect(resolveCategoryOverrides(expenses, [80], selections)).toEqual([]);
  });

  it("skips rows with no category picked yet", () => {
    const expenses = [makeExpense(80, null)];
    const selections = {};

    expect(resolveCategoryOverrides(expenses, [80], selections)).toEqual([]);
  });

  it("only overrides ids that are actually part of the approve batch", () => {
    const expenses = [makeExpense(1, 5), makeExpense(2, 5)];
    const selections = { 1: "9", 2: "9" };

    // Only id 1 was selected for approval -- id 2's edit shouldn't be swept
    // in even though its selection also changed.
    expect(resolveCategoryOverrides(expenses, [1], selections)).toEqual([{ id: 1, categoryId: 9 }]);
  });
});

describe("resolveMerchantRules", () => {
  it("reproduces the review-page bug: a checked 'always categorize' box must not be silently dropped on bulk approve", () => {
    // Same class of bug as the category-persistence one above: checking
    // "always categorize this merchant" on a row and then using "Approve
    // Selected"/"Approve All" used to ignore alwaysCategorize entirely.
    const expenses = [makeExpense(154, 32)];
    const selections = { 154: "44" };
    const alwaysCategorize = { 154: true };

    expect(resolveMerchantRules(expenses, [154], selections, alwaysCategorize)).toEqual([
      { id: 154, commercePattern: "Test Merchant", categoryId: 44 },
    ]);
  });

  it("skips rows where the box isn't checked", () => {
    const expenses = [makeExpense(80, 10)];
    const selections = { 80: "10" };
    const alwaysCategorize = {};

    expect(resolveMerchantRules(expenses, [80], selections, alwaysCategorize)).toEqual([]);
  });

  it("skips rows with no merchant name even if the box is checked", () => {
    const expenses = [makeExpense(80, 10, null)];
    const selections = { 80: "10" };
    const alwaysCategorize = { 80: true };

    expect(resolveMerchantRules(expenses, [80], selections, alwaysCategorize)).toEqual([]);
  });

  it("skips rows with no category picked yet even if the box is checked", () => {
    const expenses = [makeExpense(80, null)];
    const selections = {};
    const alwaysCategorize = { 80: true };

    expect(resolveMerchantRules(expenses, [80], selections, alwaysCategorize)).toEqual([]);
  });

  it("only includes ids that are actually part of the approve batch", () => {
    const expenses = [makeExpense(1, 5), makeExpense(2, 5)];
    const selections = { 1: "9", 2: "9" };
    const alwaysCategorize = { 1: true, 2: true };

    // Only id 1 was selected for approval -- id 2's checked box shouldn't be
    // swept in even though it's also checked.
    expect(resolveMerchantRules(expenses, [1], selections, alwaysCategorize)).toEqual([
      { id: 1, commercePattern: "Test Merchant", categoryId: 9 },
    ]);
  });

  it("uses the row's current category, whether it was changed or left as originally proposed", () => {
    const expenses = [makeExpense(1, 5)];
    const selections = { 1: "5" };
    const alwaysCategorize = { 1: true };

    expect(resolveMerchantRules(expenses, [1], selections, alwaysCategorize)).toEqual([
      { id: 1, commercePattern: "Test Merchant", categoryId: 5 },
    ]);
  });
});
