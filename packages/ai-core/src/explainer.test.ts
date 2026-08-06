import { describe, expect, it, vi } from "vitest";
import { createGeminiResultExplainer } from "./explainer";

describe("Gemini result explainer", () => {
  it("requests structured output without recalculating values", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const prompt = body.contents[0].parts[0].text as string;
      expect(prompt).toContain("Never recalculate");
      expect(prompt).toContain('"unitProfit":60');
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ summary: "Birim kâr pozitif.", caution: "Diğer giderleri ayrıca kontrol edin." }) }] } }] }), { status: 200 });
    });

    const explainer = createGeminiResultExplainer({ apiKey: "test-key", fetchImpl });
    const result = await explainer.explain("profit-margin", { cost: 100, salePrice: 160 }, { unitProfit: 60, marginPercent: 37.5 });

    expect(result.summary).toBe("Birim kâr pozitif.");
    expect(result.caution).toContain("Diğer giderleri");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("fails closed when Gemini returns an invalid payload", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 }));
    const explainer = createGeminiResultExplainer({ apiKey: "test-key", fetchImpl });
    await expect(explainer.explain("profit-margin", {}, {})).rejects.toThrow();
  });
});
