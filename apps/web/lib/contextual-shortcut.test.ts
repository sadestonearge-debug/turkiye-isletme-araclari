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

  it("routes commission to marketplace profit when price/cost context exists", () => {
    const result = resolveContextualShortcut("%20 komisyon", [
      { toolId: "profit-margin", toolTitle: "Kâr Marjı Hesaplama", inputs: { cost: 100, salePrice: 160 } },
    ]);

    expect(result).toEqual({
      toolId: "marketplace-net-profit",
      confidence: 0.98,
      extractedInputs: { salePrice: 160, productCost: 100, commissionPercent: 20 },
      missingInputs: [],
    });
  });

  it("routes commission to commission-inclusive pricing when target net context exists", () => {
    const result = resolveContextualShortcut("komisyon %18", [
      { toolId: "commission-sale-price", toolTitle: "Komisyon Dahil Satış Fiyatı Hesaplama", inputs: { targetNet: 250, commissionPercent: 15 } },
    ]);

    expect(result?.toolId).toBe("commission-sale-price");
    expect(result?.extractedInputs).toEqual({ targetNet: 250, commissionPercent: 18 });
  });

  it("treats a terse price change as a profit-margin recheck when exact cost exists", () => {
    const result = resolveContextualShortcut("fiyat 180", [
      { toolId: "discount-profit", toolTitle: "İskonto Sonrası Kâr Hesaplama", inputs: { cost: 100, listPrice: 160, discountPercent: 10 } },
    ]);

    expect(result?.toolId).toBe("profit-margin");
    expect(result?.extractedInputs).toEqual({ cost: 100, salePrice: 180 });
  });

  it("treats a terse margin target as target-price calculation using exact cost", () => {
    const result = resolveContextualShortcut("marj %35", [
      { toolId: "profit-margin", toolTitle: "Kâr Marjı Hesaplama", inputs: { cost: 100, salePrice: 160 } },
    ]);

    expect(result?.toolId).toBe("target-margin-sale-price");
    expect(result?.extractedInputs).toEqual({ totalUnitCost: 100, targetMarginPercent: 35 });
  });

  it("does not activate without a verified context", () => {
    expect(resolveContextualShortcut("%10 indirim", [])).toBeNull();
    expect(resolveContextualShortcut("%20 komisyon", [])).toBeNull();
    expect(resolveContextualShortcut("fiyat 180", [])).toBeNull();
    expect(resolveContextualShortcut("marj %35", [])).toBeNull();
  });
});
