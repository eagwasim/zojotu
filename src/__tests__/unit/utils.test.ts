import { describe, it, expect } from "vitest";
import { formatCurrency, formatPercentage, formatDate, cn } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats positive values as ZAR currency", () => {
    const result = formatCurrency(1500);
    expect(result).toContain("1");
    expect(result).toContain("500");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("formats decimal values", () => {
    const result = formatCurrency(312.25);
    expect(result).toContain("312");
    expect(result).toContain("25");
  });
});

describe("formatPercentage", () => {
  it("converts decimal to percentage string", () => {
    expect(formatPercentage(0.8777)).toBe("87.8%");
  });

  it("handles zero", () => {
    expect(formatPercentage(0)).toBe("0.0%");
  });

  it("handles values over 1", () => {
    expect(formatPercentage(1.5)).toBe("150.0%");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2026-06-25");
    expect(result).toContain("2026");
    expect(result).toContain("Jun");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});
