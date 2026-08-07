import { describe, expect, it } from "vitest";
import { buildContextualRoutingMessage, sanitizePreviousContext } from "./assistant-context";

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

  it("marks previous values as reusable inputs but forbids derivation", () => {
    const text = buildContextualRoutingMessage("Şimdi %10 indirim yaparsam?", {
      toolId: "profit-margin",
      toolTitle: "Kâr Marjı Hesaplama",
      inputs: { cost: 100, salePrice: 160 },
    });

    expect(text).toContain('"cost":100');
    expect(text).toContain('"salePrice":160');
    expect(text).toContain("Do not derive, calculate, or invent any new numeric value");
    expect(text).toContain("Şimdi %10 indirim yaparsam?");
  });
});
