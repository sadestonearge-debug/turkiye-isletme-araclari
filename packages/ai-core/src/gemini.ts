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

export function createGeminiRoutingProvider(options: GeminiProviderOptions): StructuredRoutingProvider {
  if (!options.apiKey.trim()) throw new Error("GEMINI_API_KEY is required");

  const model = options.model?.trim() || DEFAULT_MODEL;
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    name: "gemini",
    model,
    async route(message: string): Promise<ToolSelection> {
      const response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": options.apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildRoutingPrompt(message) }] }],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API request failed with status ${response.status}`);
      }

      const payload = await response.json();
      return JSON.parse(extractResponseText(payload)) as ToolSelection;
    },
  };
}
