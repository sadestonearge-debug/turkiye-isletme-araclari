import type { SafePreviousContext } from "./assistant-context";

export type ContextualShortcut = {
  toolId: string;
  confidence: number;
  extractedInputs: Record<string, number>;
  missingInputs: string[];
};

function newestExactValue(contexts: readonly SafePreviousContext[], keys: readonly string[]): number | undefined {
  for (let index = contexts.length - 1; index >= 0; index -= 1) {
    for (const key of keys) {
      const value = contexts[index]?.inputs[key];
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

function firstNonNegativeNumber(message: string): number | undefined {
  const match = message.match(/(?:%\s*)?(\d+(?:[.,]\d+)?)(?:\s*%)?/u);
  if (!match) return undefined;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function resolveContextualShortcut(
  message: string,
  contexts: readonly SafePreviousContext[],
): ContextualShortcut | null {
  if (contexts.length === 0) return null;
  const normalized = message.toLocaleLowerCase("tr-TR");

  if (normalized.includes("indirim") || normalized.includes("iskonto")) {
    const extractedInputs: Record<string, number> = {};
    const cost = newestExactValue(contexts, ["cost", "productCost", "totalUnitCost"]);
    const listPrice = newestExactValue(contexts, ["listPrice", "salePrice"]);
    const discountPercent = firstNonNegativeNumber(message);

    if (cost !== undefined) extractedInputs.cost = cost;
    if (listPrice !== undefined) extractedInputs.listPrice = listPrice;
    if (discountPercent !== undefined) extractedInputs.discountPercent = discountPercent;

    return {
      toolId: "discount-profit",
      confidence: 0.98,
      extractedInputs,
      missingInputs: [],
    };
  }

  return null;
}
