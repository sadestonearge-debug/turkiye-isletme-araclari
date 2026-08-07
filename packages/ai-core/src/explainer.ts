export type ResultExplanation = {
  summary: string;
  caution: string;
};

type GeminiExplainerOptions = {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "Verified result in plain Turkish, concise and practical." },
    caution: { type: "string", description: "One concise caution about excluded costs or assumptions." },
  },
  required: ["summary", "caution"],
  additionalProperties: false,
} as const;

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") throw new Error("Gemini returned an invalid response");
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) throw new Error("Gemini returned no candidates");
  const content = (candidates[0] as { content?: unknown }).content;
  const parts = content && typeof content === "object" ? (content as { parts?: unknown }).parts : undefined;
  if (!Array.isArray(parts)) throw new Error("Gemini returned no content parts");
  const textPart = parts.find((part): part is { text: string } => Boolean(part) && typeof part === "object" && typeof (part as { text?: unknown }).text === "string");
  if (!textPart) throw new Error("Gemini returned no text payload");
  return textPart.text;
}

function buildPrompt(toolId: string, inputs: Record<string, unknown>, result: Record<string, unknown>): string {
  return [
    "You are a concise Turkish business-calculation explainer.",
    "The numerical result below has already been calculated and verified by deterministic software.",
    "Never recalculate, alter, round differently, or introduce any number that is not present in the supplied inputs or result.",
    "Do not claim that a margin, price, payback period, or business metric is universally good/bad or an industry benchmark.",
    "Do not provide legal, tax, accounting, investment, credit, or professional financial advice.",
    "Explain the practical meaning in plain Turkish in at most two short sentences, then give one short caution about excluded costs or assumptions.",
    `Tool: ${toolId}`,
    `Verified inputs: ${JSON.stringify(inputs)}`,
    `Verified result: ${JSON.stringify(result)}`,
  ].join("\n\n");
}

export function createGeminiResultExplainer(options: GeminiExplainerOptions) {
  if (!options.apiKey.trim()) throw new Error("GEMINI_API_KEY is required");
  const model = options.model?.trim() || DEFAULT_MODEL;
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    name: "gemini",
    model,
    async explain(toolId: string, inputs: Record<string, unknown>, result: Record<string, unknown>): Promise<ResultExplanation> {
      const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": options.apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(toolId, inputs, result) }] }],
          generationConfig: {
            temperature: 0.1,
            responseFormat: {
              text: {
                mimeType: "application/json",
                schema: RESPONSE_SCHEMA,
              },
            },
          },
        }),
      });
      if (!response.ok) throw new Error(`Gemini API request failed with status ${response.status}`);
      const parsed = JSON.parse(extractResponseText(await response.json())) as ResultExplanation;
      if (!parsed.summary?.trim() || !parsed.caution?.trim()) throw new Error("Gemini returned an incomplete explanation");
      return parsed;
    },
  };
}
