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

  it("updates only shipping cost in the latest marketplace context", () => {
    const result = resolveContextualShortcut("kargoyu 60 yap", [
      { toolId: "marketplace-net-profit", toolTitle: "Pazaryeri Net Kâr Hesaplama", inputs: { salePrice: 500, productCost: 200, commissionPercent: 20, shippingCost: 50, adCost: 25 } },
    ]);

    expect(result?.toolId).toBe("marketplace-net-profit");
    expect(result?.extractedInputs).toEqual({ salePrice: 500, productCost: 200, commissionPercent: 20, shippingCost: 60, adCost: 25 });
  });

  it("updates only ad cost in the latest marketplace context", () => {
    const result = resolveContextualShortcut("reklam 30 TL olsun", [
      { toolId: "marketplace-net-profit", toolTitle: "Pazaryeri Net Kâr Hesaplama", inputs: { salePrice: 500, productCost: 200, commissionPercent: 20, shippingCost: 50, adCost: 25 } },
    ]);

    expect(result?.extractedInputs.adCost).toBe(30);
    expect(result?.extractedInputs.shippingCost).toBe(50);
  });

  it("updates the latest tool's explicit sale price without switching tools", () => {
    const result = resolveContextualShortcut("satış fiyatını 220 yap", [
      { toolId: "marketplace-net-profit", toolTitle: "Pazaryeri Net Kâr Hesaplama", inputs: { salePrice: 200, productCost: 120, commissionPercent: 20, shippingCost: 30, adCost: 10 } },
    ]);

    expect(result?.toolId).toBe("marketplace-net-profit");
    expect(result?.extractedInputs.salePrice).toBe(220);
    expect(result?.extractedInputs.productCost).toBe(120);
  });

  it("updates the tool-specific cost field without inventing other values", () => {
    const result = resolveContextualShortcut("maliyet 140 oldu", [
      { toolId: "discount-profit", toolTitle: "İskonto Sonrası Kâr Hesaplama", inputs: { cost: 100, listPrice: 180, discountPercent: 10 } },
    ]);

    expect(result?.toolId).toBe("discount-profit");
    expect(result?.extractedInputs).toEqual({ cost: 140, listPrice: 180, discountPercent: 10 });
  });

  it("updates an explicit commission field on the latest tool", () => {
    const result = resolveContextualShortcut("komisyonu %18'e düşür", [
      { toolId: "marketplace-net-profit", toolTitle: "Pazaryeri Net Kâr Hesaplama", inputs: { salePrice: 500, productCost: 200, commissionPercent: 20, shippingCost: 50, adCost: 25 } },
    ]);

    expect(result?.toolId).toBe("marketplace-net-profit");
    expect(result?.extractedInputs.commissionPercent).toBe(18);
  });

  it("does not activate without a verified context", () => {
    expect(resolveContextualShortcut("%10 indirim", [])).toBeNull();
    expect(resolveContextualShortcut("%20 komisyon", [])).toBeNull();
    expect(resolveContextualShortcut("fiyat 180", [])).toBeNull();
    expect(resolveContextualShortcut("marj %35", [])).toBeNull();
    expect(resolveContextualShortcut("kargoyu 60 yap", [])).toBeNull();
  });
});
