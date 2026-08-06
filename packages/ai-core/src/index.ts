import type { ToolSelection } from "../../shared/src/index";
import { tools } from "../../tool-registry/src/index";

export type AiRouter = (message: string) => Promise<ToolSelection>;

export type AiCore = {
  selectTool: AiRouter;
};

export function createRuleBasedAiCore(): AiCore {
  return {
    async selectTool(message: string): Promise<ToolSelection> {
      const normalized = message.toLocaleLowerCase("tr-TR");

      if (normalized.includes("marj") && normalized.includes("satış")) {
        return {
          toolId: "target-margin-sale-price",
          confidence: 0.7,
          extractedInputs: {},
          missingInputs: ["totalUnitCost", "targetMarginPercent"],
        };
      }

      if (normalized.includes("kâr") || normalized.includes("kar")) {
        return {
          toolId: "profit-margin",
          confidence: 0.6,
          extractedInputs: {},
          missingInputs: ["cost", "salePrice"],
        };
      }

      return {
        toolId: null,
        confidence: 0,
        extractedInputs: {},
        missingInputs: [],
      };
    },
  };
}

export function isRegisteredTool(toolId: string | null): boolean {
  return toolId !== null && tools.some((tool) => tool.id === toolId);
}
