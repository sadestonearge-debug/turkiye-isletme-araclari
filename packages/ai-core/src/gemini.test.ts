import { describe, expect, it } from "vitest";
import { createGeminiRoutingProvider } from "./gemini";

describe("Gemini routing provider", () => {
  it("parses structured routing output without performing calculations", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      toolId: "profit-margin",
                      confidence: 0.98,
                      extractedInputs: { cost: 100, salePrice: 160 },
                      missingInputs: [],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const provider = createGeminiRoutingProvider({
      apiKey: "test-key",
      model: "gemini-test",
      fetchImpl,
    });

    await expect(provider.route("100 liraya alıp 160 liraya satıyorum, marjım ne?"))
      .resolves.toEqual({
        toolId: "profit-margin",
        confidence: 0.98,
        extractedInputs: { cost: 100, salePrice: 160 },
        missingInputs: [],
      });
  });

  it("fails closed when Gemini returns no usable candidate", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ candidates: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const provider = createGeminiRoutingProvider({ apiKey: "test-key", fetchImpl });
    await expect(provider.route("test")).rejects.toThrow("no candidates");
  });
});
