import { describe, expect, it } from "vitest";
import { cycleBounds, shiftISODate } from "./cardCycle";

describe("cycleBounds", () => {
  it("opens on the cutoff day", () => {
    expect(cycleBounds(15, new Date(2026, 8, 25))).toEqual({ start: "2026-09-15", end: "2026-10-14" });
  });
  it("uses the previous month before the cutoff", () => {
    expect(cycleBounds(15, new Date(2026, 8, 4))).toEqual({ start: "2026-08-15", end: "2026-09-14" });
  });
  it("crosses the year", () => {
    expect(cycleBounds(20, new Date(2026, 0, 5))).toEqual({ start: "2025-12-20", end: "2026-01-19" });
  });
  it("clamps to short months", () => {
    expect(cycleBounds(31, new Date(2026, 1, 10))).toEqual({ start: "2026-01-31", end: "2026-02-27" });
  });
  it("falls back to the calendar month", () => {
    expect(cycleBounds(null, new Date(2026, 8, 25))).toEqual({ start: "2026-09-01", end: "2026-09-30" });
  });
  it("shifts across months", () => {
    expect(shiftISODate("2026-09-15", -1)).toBe("2026-09-14");
    expect(shiftISODate("2026-09-30", 1)).toBe("2026-10-01");
  });
});
