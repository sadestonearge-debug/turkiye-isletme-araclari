import { describe, expect, it } from "vitest";
import { executeTool } from "./execute";

describe("tool execution", () => {
  it("validates and executes a registered calculator", () => {
    expect(executeTool("profit-margin", { cost: 100, salePrice: 160 })).toEqual({
      ok: true,
      toolId: "profit-margin",
      toolVersion: "1.0.0",
      result: {
        unitProfit: 60,
        profitRatePercent: 60,
        marginPercent: 37.5,
        breakEvenPrice: 100,
      },
    });
  });

  it("rejects missing required input before calculator execution", () => {
    const result = executeTool("profit-margin", { cost: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_input");
  });

  it("converts calculator range failures into invalid input", () => {
    const result = executeTool("profit-margin", { cost: 0, salePrice: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_input");
  });

  it("rejects unknown tools", () => {
    expect(executeTool("does-not-exist", {})).toEqual({ ok: false, code: "unknown_tool" });
  });
});
