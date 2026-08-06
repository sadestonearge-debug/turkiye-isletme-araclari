import type { ToolSelection } from "../../shared/src/index";
import { getTool, requiredInputKeys, tools } from "../../tool-registry/src/index";

export { createGeminiResultExplainer } from "./explainer";
export type { ResultExplanation } from "./explainer";

export type AiRouter = (message: string) => Promise<ToolSelection>;

export type AiCore = {
  selectTool: AiRouter;
};

const RULES: readonly { toolId: string; terms: readonly string[] }[] = [
  { toolId: "marketplace-net-profit", terms: ["pazaryeri", "trendyol", "komisyon", "kargo"] },
  { toolId: "portion-cost", terms: ["porsiyon", "reçete", "recete", "malzeme", "fire"] },
  { toolId: "machine-payback", terms: ["amortisman", "makine", "yatırım", "yatirim", "kaç ay"] },
  { toolId: "break-even-revenue", terms: ["başa baş", "basa bas", "ciro", "sabit gider"] },
  { toolId: "discount-profit", terms: ["iskonto", "indirim"] },
  { toolId: "commission-sale-price", terms: ["komisyon dahil", "komisyon sonrası", "komisyon sonrasi"] },
  { toolId: "target-margin-sale-price", terms: ["hedef marj", "kaça sat", "kaca sat", "satış fiyatı", "satis fiyati"] },
  { toolId: "profit-margin", terms: ["kâr", "kar", "marj"] },
] as const;

export function createRuleBasedAiCore(): AiCore {
  return {
    async selectTool(message: string): Promise<ToolSelection> {
      const normalized = message.toLocaleLowerCase("tr-TR");
      let best: { toolId: string; score: number } | null = null;

      for (const rule of RULES) {
        const score = rule.terms.reduce((sum, term) => sum + (normalized.includes(term) ? 1 : 0), 0);
        if (score > 0 && (!best || score > best.score)) best = { toolId: rule.toolId, score };
      }

      if (!best) {
        return { toolId: null, confidence: 0, extractedInputs: {}, missingInputs: [] };
      }

      const tool = getTool(best.toolId);
      if (!tool) {
        return { toolId: null, confidence: 0, extractedInputs: {}, missingInputs: [] };
      }

      return {
        toolId: tool.id,
        confidence: Math.min(0.55 + best.score * 0.1, 0.9),
        extractedInputs: {},
        missingInputs: requiredInputKeys(tool),
      };
    },
  };
}

export function isRegisteredTool(toolId: string | null): boolean {
  return toolId !== null && tools.some((tool) => tool.id === toolId);
}
