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

export function sanitizePreviousContexts(value: unknown): SafePreviousContext[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-3)
    .map(sanitizePreviousContext)
    .filter((context): context is SafePreviousContext => context !== null);
}

export function buildContextualRoutingMessage(message: string, contexts: SafePreviousContext[]): string {
  if (contexts.length === 0) return message;
  const history = contexts
    .map((context, index) => `${index + 1}. ${context.toolId} (${context.toolTitle}) inputs=${JSON.stringify(context.inputs)}`)
    .join("\n");

  return [
    "The user is asking a follow-up after a short chain of verified calculator input sets.",
    "Verified calculator history (oldest to newest):",
    history,
    "Prefer the newest semantically applicable exact value. Older values may be reused only when the newer contexts do not provide an applicable value.",
    "You may reuse only exact numeric values shown in this history when they are semantically applicable to the newly selected tool.",
    "Do not derive, calculate, combine, average, transform, or invent any new numeric value from the history.",
    "User follow-up:",
    message,
  ].join("\n\n");
}
