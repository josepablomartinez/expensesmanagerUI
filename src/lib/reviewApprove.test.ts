import { describe, expect, it } from "vitest";
import type { Expense } from "./api";
import { resolveCategoryOverrides } from "./reviewApprove";

function makeExpense(id: number, categoryId: number | null): Expense {
  return {
    id,
    country: null,
    city: null,
    merchant: "Test Merchant",
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
