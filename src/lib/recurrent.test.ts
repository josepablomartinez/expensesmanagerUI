import { describe, expect, it } from "vitest";
import type { RecurrentDue } from "@/lib/api";
import { apiDate, localDate, payUrl, periodKey, readPayPrefill } from "@/lib/recurrent";

const due: RecurrentDue = {
  recurrent_expense_id: 7,
  name: "Netflix & chill",
  category_id: 50,
  category_name: "Servicios/Streaming",
  period: "2026-10-01T00:00:00Z",
  due_date: "2026-10-05T00:00:00Z",
  days_until_due: 11,
  status: "pending",
  amount: 13.99,
  currency: "USD",
  expense_id: null,
  expense_date: null,
  expense_amount: null,
  expense_currency: null,
  expense_merchant: null,
  previous_period: null,
  previous_status: null,
  previous_expense_id: null,
  previous_expense_date: null,
  previous_expense_amount: null,
  previous_expense_currency: null,
  previous_expense_merchant: null,
};

describe("dates", () => {
  it("keeps API dates on their own day", () => {
    expect(apiDate("2026-10-01T00:00:00Z")).toBe("2026-10-01");
    expect(periodKey("2026-10-01T00:00:00Z")).toBe("2026-10");
    const d = localDate("2026-10-01T00:00:00Z");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 1]);
  });
});

describe("pay prefill", () => {
  it("round-trips a due card through the Add Expense URL", () => {
    const url = payUrl(due);
    expect(url.startsWith("/add?")).toBe(true);
    const prefill = readPayPrefill(new URLSearchParams(url.slice("/add?".length)));
    expect(prefill).toEqual({
      recurrentExpenseId: 7,
      period: "2026-10",
      name: "Netflix & chill",
      categoryId: 50,
      amount: 13.99,
      currency: "USD",
    });
  });

  it("leaves the amount empty when the subcategory has no budget", () => {
    const url = payUrl({ ...due, amount: null, currency: null });
    const prefill = readPayPrefill(new URLSearchParams(url.slice("/add?".length)));
    expect(prefill?.amount).toBeNull();
    expect(prefill?.currency).toBe("CRC");
  });

  it("ignores a plain or malformed Add Expense URL", () => {
    expect(readPayPrefill(new URLSearchParams(""))).toBeNull();
    expect(readPayPrefill(new URLSearchParams("recurrent=7&category=50&period=2026-13"))).toBeNull();
    expect(readPayPrefill(new URLSearchParams("recurrent=abc&category=50&period=2026-10"))).toBeNull();
    expect(readPayPrefill(new URLSearchParams("recurrent=7&period=2026-10"))).toBeNull();
  });
});
