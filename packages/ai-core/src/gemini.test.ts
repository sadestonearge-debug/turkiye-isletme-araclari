import { describe, expect, it, vi } from "vitest";
import { createGeminiRoutingProvider } from "./gemini";

function successPayload() {
  return JSON.stringify({
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
  });
}

describe("Gemini routing provider", () => {
  it("parses structured routing output without performing calculations", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(successPayload(), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

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

  it("retries once without structured schema when Gemini rejects it with 400", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { generationConfig?: { responseFormat?: unknown } };
      if (fetchImpl.mock.calls.length === 1) {
        expect(body.generationConfig?.responseFormat).toBeDefined();
        return new Response("{}", { status: 400 });
      }
      expect(body.generationConfig?.responseFormat).toBeUndefined();
      return new Response(successPayload(), { status: 200, headers: { "Content-Type": "application/json" } });
    });

    const provider = createGeminiRoutingProvider({ apiKey: "test-key", fetchImpl });
    const result = await provider.route("Maliyetim 100 TL, 160 TL'ye satıyorum. Marjım ne?");

    expect(result.extractedInputs).toEqual({ cost: 100, salePrice: 160 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
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
