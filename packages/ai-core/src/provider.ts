import type { ToolSelection } from "../../shared/src/index";
import { getTool, requiredInputKeys } from "../../tool-registry/src/index";
import type { AiCore } from "./index";

export type StructuredRoutingProvider = {
  name: string;
  model: string;
  route(message: string): Promise<ToolSelection>;
};

function sanitizeSelection(selection: ToolSelection): ToolSelection | null {
  if (selection.toolId === null) return selection;
  const tool = getTool(selection.toolId);
  if (!tool) return null;

  const extractedInputs = Object.fromEntries(
    Object.entries(selection.extractedInputs).filter(([key]) => tool.inputs.some((input) => input.key === key)),
  );

  const missingInputs = requiredInputKeys(tool).filter((key) => extractedInputs[key] === undefined);

  return {
    toolId: tool.id,
    confidence: Math.max(0, Math.min(1, selection.confidence)),
    extractedInputs,
    missingInputs,
  };
}

export function createProviderBackedAiCore(
  provider: StructuredRoutingProvider,
  fallback: AiCore,
): AiCore {
  return {
    async selectTool(message: string): Promise<ToolSelection> {
      try {
        const candidate = await provider.route(message);
        const sanitized = sanitizeSelection(candidate);
        return sanitized ?? fallback.selectTool(message);
      } catch {
        return fallback.selectTool(message);
      }
    },
  };
}
