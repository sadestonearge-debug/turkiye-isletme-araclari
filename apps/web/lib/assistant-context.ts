import { sanitizeExtractedInputs } from "./prefill";
import { toolPages } from "./tools";

export type SafePreviousContext = {
  toolId: string;
  toolTitle: string;
  inputs: Record<string, number>;
};

export function sanitizePreviousContext(value: unknown): SafePreviousContext | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { toolId?: unknown; inputs?: unknown };
  if (typeof candidate.toolId !== "string" || !candidate.inputs || typeof candidate.inputs !== "object") return null;

  const tool = toolPages.find((item) => item.id === candidate.toolId);
  if (!tool) return null;

  const inputs = sanitizeExtractedInputs(tool, candidate.inputs as Record<string, unknown>);
  if (Object.keys(inputs).length === 0) return null;

  return { toolId: tool.id, toolTitle: tool.title, inputs };
}

export function buildContextualRoutingMessage(message: string, context: SafePreviousContext | null): string {
  if (!context) return message;
  return [
    "The user is asking a follow-up after a previous verified calculator input set.",
    `Previous tool: ${context.toolId} (${context.toolTitle})`,
    `Previous verified user inputs: ${JSON.stringify(context.inputs)}`,
    "You may reuse only these exact previous input values when they are semantically applicable to the newly selected tool.",
    "Do not derive, calculate, or invent any new numeric value from the previous context.",
    "User follow-up:",
    message,
  ].join("\n\n");
}
