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

function shortcut(toolId: string, extractedInputs: Record<string, number>): ContextualShortcut {
  return {
    toolId,
    confidence: 0.98,
    extractedInputs,
    missingInputs: [],
  };
}

export function resolveContextualShortcut(
  message: string,
  contexts: readonly SafePreviousContext[],
): ContextualShortcut | null {
  if (contexts.length === 0) return null;
  const normalized = message.toLocaleLowerCase("tr-TR");
  const explicitNumber = firstNonNegativeNumber(message);

  if (normalized.includes("indirim") || normalized.includes("iskonto")) {
    const extractedInputs: Record<string, number> = {};
    const cost = newestExactValue(contexts, ["cost", "productCost", "totalUnitCost"]);
    const listPrice = newestExactValue(contexts, ["listPrice", "salePrice"]);

    if (cost !== undefined) extractedInputs.cost = cost;
    if (listPrice !== undefined) extractedInputs.listPrice = listPrice;
    if (explicitNumber !== undefined) extractedInputs.discountPercent = explicitNumber;

    return shortcut("discount-profit", extractedInputs);
  }

  if (normalized.includes("komisyon")) {
    const targetNet = newestExactValue(contexts, ["targetNet"]);
    if (targetNet !== undefined) {
      const extractedInputs: Record<string, number> = { targetNet };
      if (explicitNumber !== undefined) extractedInputs.commissionPercent = explicitNumber;
      return shortcut("commission-sale-price", extractedInputs);
    }

    const salePrice = newestExactValue(contexts, ["salePrice", "listPrice"]);
    const productCost = newestExactValue(contexts, ["productCost", "cost", "totalUnitCost"]);
    if (salePrice !== undefined || productCost !== undefined) {
      const extractedInputs: Record<string, number> = {};
      if (salePrice !== undefined) extractedInputs.salePrice = salePrice;
      if (productCost !== undefined) extractedInputs.productCost = productCost;
      if (explicitNumber !== undefined) extractedInputs.commissionPercent = explicitNumber;
      return shortcut("marketplace-net-profit", extractedInputs);
    }
  }

  if (normalized.includes("marj")) {
    const totalUnitCost = newestExactValue(contexts, ["totalUnitCost", "cost", "productCost"]);
    if (totalUnitCost !== undefined) {
      const extractedInputs: Record<string, number> = { totalUnitCost };
      if (explicitNumber !== undefined) extractedInputs.targetMarginPercent = explicitNumber;
      return shortcut("target-margin-sale-price", extractedInputs);
    }
  }

  if (normalized.includes("fiyat")) {
    const cost = newestExactValue(contexts, ["cost", "productCost", "totalUnitCost"]);
    if (cost !== undefined && explicitNumber !== undefined) {
      return shortcut("profit-margin", { cost, salePrice: explicitNumber });
    }
  }

  return null;
}
