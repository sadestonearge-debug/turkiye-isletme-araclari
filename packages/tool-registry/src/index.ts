import type { ToolDefinition } from "../../shared/src/index";

export const tools: readonly ToolDefinition[] = [
  {
    id: "profit-margin",
    version: "1.0.0",
    category: "pricing",
    title: "Kâr Marjı Hesaplama",
    description: "Maliyet ve satış fiyatından birim kâr, kâr oranı ve marjı hesaplar.",
    riskLevel: "low",
    calculatorId: "profit-margin",
    requiredInputs: ["cost", "salePrice"],
  },
  {
    id: "target-margin-sale-price",
    version: "1.0.0",
    category: "pricing",
    title: "Hedef Marja Göre Satış Fiyatı",
    description: "Toplam birim maliyet ve hedef marjdan önerilen satış fiyatını hesaplar.",
    riskLevel: "low",
    calculatorId: "target-margin-sale-price",
    requiredInputs: ["totalUnitCost", "targetMarginPercent"],
  },
] as const;

export function getTool(toolId: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.id === toolId);
}
