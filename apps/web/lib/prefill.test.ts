import { describe, expect, it } from "vitest";
import { buildPrefillQuery, parsePrefillSearchParams, sanitizeExtractedInputs } from "./prefill";
import { toolPages } from "./tools";

const profitMargin = toolPages.find((tool) => tool.id === "profit-margin")!;

describe("AI prefill safety", () => {
  it("keeps only registered finite non-negative numeric inputs", () => {
    expect(sanitizeExtractedInputs(profitMargin, {
      cost: 100,
      salePrice: 160,
      injected: 999,
      text: "100",
      negative: -5,
    })).toEqual({ cost: 100, salePrice: 160 });
  });

  it("revalidates URL search params against the selected tool", () => {
    expect(parsePrefillSearchParams(profitMargin, {
      cost: "100",
      salePrice: "160",
      fixedCosts: "999999",
      bad: "Infinity",
    })).toEqual({ cost: 100, salePrice: 160 });
  });

  it("builds a compact query string from safe values", () => {
    expect(buildPrefillQuery({ cost: 100, salePrice: 160 })).toBe("cost=100&salePrice=160");
  });
});
