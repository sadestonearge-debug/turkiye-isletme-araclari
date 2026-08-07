import { describe, expect, it } from "vitest";
import { getToolPageBySlug } from "./tools";
import { mergeFollowUpValue, nextMissingInput, parseSingleNumber } from "./conversation";

describe("conversational missing-input helpers", () => {
  it("parses Turkish decimal, dot decimal and currency-like replies", () => {
    expect(parseSingleNumber("100 TL")).toBe(100);
    expect(parseSingleNumber("12,5")).toBe(12.5);
    expect(parseSingleNumber("12.5")).toBe(12.5);
    expect(parseSingleNumber("1.250 TL")).toBe(1250);
  });

  it("rejects missing and negative replies", () => {
    expect(parseSingleNumber("bilmiyorum")).toBeNull();
    expect(parseSingleNumber("-10")).toBeNull();
  });

  it("fills missing fields one at a time in tool order", () => {
    const tool = getToolPageBySlug("kar-marji-hesaplama");
    if (!tool) throw new Error("tool missing");

    const values = { salePrice: 160 };
    expect(nextMissingInput(tool, values)).toBe("cost");

    const step = mergeFollowUpValue(tool, values, "cost", "100");
    expect(step.accepted).toBe(true);
    expect(step.values).toEqual({ salePrice: 160, cost: 100 });
    expect(step.nextMissing).toBeNull();
  });
});
