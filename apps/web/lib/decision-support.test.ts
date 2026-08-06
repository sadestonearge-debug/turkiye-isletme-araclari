import { describe, expect, it } from "vitest";
import { getDecisionCopy, getScenarioRequests, nextTools } from "./decision-support";

const scenarioInputs: Record<string, Record<string, number>> = {
  "profit-margin": { cost: 100, salePrice: 160 },
  "target-margin-sale-price": { totalUnitCost: 145, targetMarginPercent: 30 },
  "discount-profit": { cost: 100, listPrice: 200, discountPercent: 10 },
  "commission-sale-price": { targetNet: 100, commissionPercent: 20 },
  "break-even-revenue": { fixedCosts: 300000, contributionMarginPercent: 60 },
  "portion-cost": { ingredientCost: 50, wastePercent: 10, packagingCost: 5, extraCost: 2 },
  "marketplace-net-profit": { salePrice: 500, productCost: 200, commissionPercent: 20, shippingCost: 50, adCost: 25 },
  "machine-payback": { investmentCost: 100000, monthlyNetContribution: 12000 },
};

describe("decision support scenarios", () => {
  it("creates a three-scenario comparison for every published tool", () => {
    for (const [toolId, inputs] of Object.entries(scenarioInputs)) {
      const scenarios = getScenarioRequests(toolId, inputs);
      expect(scenarios).toHaveLength(3);
      expect(scenarios.filter((scenario) => scenario.current)).toHaveLength(1);
      expect(nextTools[toolId]).toBeDefined();
    }
  });

  it("keeps percentage variants inside safe calculator boundaries", () => {
    const high = getScenarioRequests("target-margin-sale-price", { totalUnitCost: 100, targetMarginPercent: 98 });
    expect(high[2].values.targetMarginPercent).toBe(99);

    const low = getScenarioRequests("discount-profit", { cost: 100, listPrice: 200, discountPercent: 2 });
    expect(low[0].values.discountPercent).toBe(0);
  });
});

describe("decision support copy", () => {
  it("warns when profit margin calculation produces a loss", () => {
    const decision = getDecisionCopy("profit-margin", { unitProfit: -20, marginPercent: -25 });
    expect(decision.tone).toBe("warning");
    expect(decision.title).toContain("maliyetinizi karşılamıyor");
  });

  it("warns when marketplace net profit is negative", () => {
    const decision = getDecisionCopy("marketplace-net-profit", { netProfit: -15, netMarginPercent: -3 });
    expect(decision.tone).toBe("warning");
  });

  it("returns tool-specific neutral guidance for deterministic outputs", () => {
    expect(getDecisionCopy("break-even-revenue", { breakEvenRevenue: 500000 }).title).toContain("Başa baş");
    expect(getDecisionCopy("machine-payback", { paybackMonths: 9 }).body).toContain("paranın zaman değerini içermez");
  });
});
