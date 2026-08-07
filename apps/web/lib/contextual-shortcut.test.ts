import { describe, expect, it } from "vitest";
import { resolveContextualShortcut } from "./contextual-shortcut";

describe("contextual shortcut routing", () => {
  it("routes a terse discount follow-up and carries exact verified values", () => {
    const result = resolveContextualShortcut("%10 indirim", [
      { toolId: "profit-margin", toolTitle: "Kâr Marjı Hesaplama", inputs: { cost: 100, salePrice: 160 } },
    ]);

    expect(result).toEqual({
      toolId: "discount-profit",
      confidence: 0.98,
      extractedInputs: { cost: 100, listPrice: 160, discountPercent: 10 },
      missingInputs: [],
    });
  });

  it("uses the newest semantically applicable exact values across a context chain", () => {
    const result = resolveContextualShortcut("%15 iskonto", [
      { toolId: "profit-margin", toolTitle: "Kâr Marjı Hesaplama", inputs: { cost: 100, salePrice: 160 } },
      { toolId: "marketplace-net-profit", toolTitle: "Pazaryeri Net Kâr Hesaplama", inputs: { productCost: 120, salePrice: 200, commissionPercent: 20 } },
    ]);

    expect(result?.extractedInputs).toEqual({ cost: 120, listPrice: 200, discountPercent: 15 });
  });

  it("does not activate without a verified context", () => {
    expect(resolveContextualShortcut("%10 indirim", [])).toBeNull();
  });
});
