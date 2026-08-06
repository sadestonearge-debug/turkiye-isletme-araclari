import { describe, expect, it } from "vitest";
import { createRuleBasedAiCore, isRegisteredTool } from "./index";

describe("rule based AI core", () => {
  const ai = createRuleBasedAiCore();

  it("routes cafe portion cost intent", async () => {
    const result = await ai.selectTool("Bir porsiyonun malzeme ve fire dahil maliyetini hesapla");
    expect(result.toolId).toBe("portion-cost");
    expect(result.missingInputs).toContain("ingredientCost");
  });

  it("routes marketplace net profit intent", async () => {
    const result = await ai.selectTool("Trendyol komisyon ve kargo sonrası net karım ne olur?");
    expect(result.toolId).toBe("marketplace-net-profit");
  });

  it("returns null for unrelated intent", async () => {
    const result = await ai.selectTool("Bugün hava nasıl?");
    expect(result.toolId).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it("recognizes registered tools", () => {
    expect(isRegisteredTool("machine-payback")).toBe(true);
    expect(isRegisteredTool("unknown-tool")).toBe(false);
  });
});
