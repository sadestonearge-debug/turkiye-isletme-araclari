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

  it("retries once without structured output when Gemini rejects the schema request", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      if (fetchImpl.mock.calls.length === 1) {
        expect(body.generationConfig.responseFormat).toBeDefined();
        return new Response(JSON.stringify({ error: { code: 400 } }), { status: 400 });
      }

      expect(body.generationConfig.responseFormat).toBeUndefined();
      return new Response(
        JSON.stringify({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ summary: "Birim kâr 60 TL.", caution: "Diğer giderler dahil değildir." }) }],
            },
          }],
        }),
        { status: 200 },
      );
    });

    const explainer = createGeminiResultExplainer({ apiKey: "test-key", fetchImpl });
    await expect(explainer.explain("profit-margin", { cost: 100 }, { unitProfit: 60 }))
      .resolves.toEqual({ summary: "Birim kâr 60 TL.", caution: "Diğer giderler dahil değildir." });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails closed when Gemini returns an invalid payload", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 }));
    const explainer = createGeminiResultExplainer({ apiKey: "test-key", fetchImpl });
    await expect(explainer.explain("profit-margin", {}, {})).rejects.toThrow();
  });
});