import type { ToolSelection } from "../../shared/src/index";
import { tools } from "../../tool-registry/src/index";
import type { StructuredRoutingProvider } from "./provider";

type GeminiProviderOptions = {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
};

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

const TOOL_IDS = tools.map((tool) => tool.id);

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    toolId: {
      anyOf: [
        { type: "string", enum: TOOL_IDS },
        { type: "null" },
      ],
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    extractedInputs: {
      type: "object",
      additionalProperties: {
        anyOf: [
          { type: "string" },
          { type: "number" },
          { type: "boolean" },
        ],
      },
    },
    missingInputs: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["toolId", "confidence", "extractedInputs", "missingInputs"],
  additionalProperties: false,
} as const;

function buildRoutingPrompt(message: string): string {
  const catalogue = tools
    .map(
      (tool) =>
        `- ${tool.id}: ${tool.title}. Required inputs: ${tool.inputs
          .filter((input) => input.required)
          .map((input) => input.key)
          .join(", ")}`,
    )
    .join("\n");

  return [
    "You are a Turkish business-calculator router.",
    "Select exactly one registered tool only when the user's intent clearly matches it.",
    "Never calculate the financial result yourself.",
    "Extract only values explicitly provided by the user. Never invent missing values.",
    "If no tool clearly matches, return toolId as null.",
    "Return JSON only with exactly these fields: toolId, confidence, extractedInputs, missingInputs.",
    "Registered tools:",
    catalogue,
    "User message:",
    message,
  ].join("\n\n");
}

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") throw new Error("Gemini returned an invalid response");
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) throw new Error("Gemini returned no candidates");
  const content = (candidates[0] as { content?: unknown }).content;
  const parts = content && typeof content === "object" ? (content as { parts?: unknown }).parts : undefined;
  if (!Array.isArray(parts)) throw new Error("Gemini returned no content parts");
  const textPart = parts.find(
    (part): part is { text: string } =>
      Boolean(part) && typeof part === "object" && typeof (part as { text?: unknown }).text === "string",
  );
  if (!textPart) throw new Error("Gemini returned no text payload");
  return textPart.text;
}

function parseSelection(payload: unknown): ToolSelection {
  const parsed = JSON.parse(extractResponseText(payload)) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Gemini returned an invalid selection shape");

  const value = parsed as Record<string, unknown>;
  if (value.toolId !== null && typeof value.toolId !== "string") throw new Error("Gemini returned an invalid toolId");
  if (typeof value.confidence !== "number" || !Number.isFinite(value.confidence)) throw new Error("Gemini returned an invalid confidence");
  if (!value.extractedInputs || typeof value.extractedInputs !== "object" || Array.isArray(value.extractedInputs)) {
    throw new Error("Gemini returned invalid extracted inputs");
  }
  if (!Array.isArray(value.missingInputs) || !value.missingInputs.every((item) => typeof item === "string")) {
    throw new Error("Gemini returned invalid missing inputs");
  }

  return {
    toolId: value.toolId as string | null,
    confidence: value.confidence,
    extractedInputs: value.extractedInputs as Record<string, string | number | boolean>,
    missingInputs: value.missingInputs as string[],
  };
}

export function createGeminiRoutingProvider(options: GeminiProviderOptions): StructuredRoutingProvider {
  if (!options.apiKey.trim()) throw new Error("GEMINI_API_KEY is required");

  const model = options.model?.trim() || DEFAULT_MODEL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  async function request(prompt: string, structured: boolean): Promise<Response> {
    return fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: structured
          ? {
              temperature: 0,
              responseFormat: {
                text: {
                  mimeType: "application/json",
                  schema: RESPONSE_SCHEMA,
                },
              },
            }
          : { temperature: 0 },
      }),
    });
  }

  return {
    name: "gemini",
    model,
    async route(message: string): Promise<ToolSelection> {
      const prompt = buildRoutingPrompt(message);
      let response = await request(prompt, true);

      // Keep routing compatible across Gemini API structured-output revisions.
      if (response.status === 400) {
        response = await request(prompt, false);
      }

      if (!response.ok) {
        throw new Error(`Gemini API request failed with status ${response.status}`);
      }

      return parseSelection(await response.json());
    },
  };
}
