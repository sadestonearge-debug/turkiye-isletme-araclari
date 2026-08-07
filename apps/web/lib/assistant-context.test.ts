import { describe, expect, it } from "vitest";
import {
  buildContextualRoutingMessage,
  sanitizePreviousContext,
  sanitizePreviousContexts,
} from "./assistant-context";

describe("assistant follow-up context", () => {
  it("keeps only allowed finite numeric inputs for a registered tool", () => {
    expect(sanitizePreviousContext({
      toolId: "profit-margin",
      inputs: { cost: 100, salePrice: 160, injected: 999, bad: "x" },
    })).toEqual({
      toolId: "profit-margin",
      toolTitle: "Kâr Marjı Hesaplama",
      inputs: { cost: 100, salePrice: 160 },
    });
  });

  it("rejects unknown or empty previous contexts", () => {
    expect(sanitizePreviousContext({ toolId: "unknown", inputs: { cost: 100 } })).toBeNull();
    expect(sanitizePreviousContext({ toolId: "profit-margin", inputs: {} })).toBeNull();
  });

  it("bounds and sanitizes the context chain to the latest three entries", () => {
    const contexts = sanitizePreviousContexts([
      { toolId: "profit-margin", inputs: { cost: 90, salePrice: 150 } },
      { toolId: "profit-margin", inputs: { cost: 100, salePrice: 160 } },
      { toolId: "discount-profit", inputs: { cost: 100, listPrice: 160, discountPercent: 10 } },
      { toolId: "marketplace-net-profit", inputs: { salePrice: 144, productCost: 100, commissionPercent: 20, injected: 1 } },
    ]);

    expect(contexts).toHaveLength(3);
    expect(contexts[0]?.toolId).toBe("profit-margin");
    expect(contexts[2]?.inputs).toEqual({ salePrice: 144, productCost: 100, commissionPercent: 20 });
  });

  it("marks historical values as reusable exact inputs but forbids derivation", () => {
    const text = buildContextualRoutingMessage("Şimdi komisyon %20 olursa?", [
      { toolId: "profit-margin", toolTitle: "Kâr Marjı Hesaplama", inputs: { cost: 100, salePrice: 160 } },
      { toolId: "discount-profit", toolTitle: "İskonto Sonrası Kâr Hesaplama", inputs: { cost: 100, listPrice: 160, discountPercent: 10 } },
    ]);

    expect(text).toContain('"cost":100');
    expect(text).toContain('"listPrice":160');
    expect(text).toContain("Prefer the newest semantically applicable exact value");
    expect(text).toContain("Do not derive, calculate, combine, average, transform, or invent any new numeric value");
    expect(text).toContain("Şimdi komisyon %20 olursa?");
  });
});
