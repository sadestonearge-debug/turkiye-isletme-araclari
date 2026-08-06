import type { ToolDefinition, ToolInputDefinition } from "../../shared/src/index";

const money = (key: string, label: string, required = true): ToolInputDefinition => ({
  key,
  label,
  type: "money",
  required,
  min: 0,
});

const percentage = (key: string, label: string, required = true): ToolInputDefinition => ({
  key,
  label,
  type: "percentage",
  required,
  min: 0,
  max: 100,
});

export const tools: readonly ToolDefinition[] = [
  {
    id: "profit-margin",
    version: "1.0.0",
    category: "pricing",
    title: "Kâr Marjı Hesaplama",
    description: "Maliyet ve satış fiyatından birim kâr, kâr oranı ve marjı hesaplar.",
    riskLevel: "low",
    calculatorId: "profit-margin",
    inputs: [money("cost", "Birim maliyet"), money("salePrice", "Satış fiyatı")],
  },
  {
    id: "target-margin-sale-price",
    version: "1.0.0",
    category: "pricing",
    title: "Hedef Marja Göre Satış Fiyatı",
    description: "Toplam birim maliyet ve hedef marjdan önerilen satış fiyatını hesaplar.",
    riskLevel: "low",
    calculatorId: "target-margin-sale-price",
    inputs: [money("totalUnitCost", "Toplam birim maliyet"), percentage("targetMarginPercent", "Hedef marj")],
  },
  {
    id: "discount-profit",
    version: "1.0.0",
    category: "pricing",
    title: "İskonto Sonrası Kâr",
    description: "İndirim sonrası satış fiyatını, kârı ve marjı hesaplar.",
    riskLevel: "low",
    calculatorId: "discount-profit",
    inputs: [money("cost", "Birim maliyet"), money("listPrice", "Liste fiyatı"), percentage("discountPercent", "İskonto")],
  },
  {
    id: "commission-sale-price",
    version: "1.0.0",
    category: "pricing",
    title: "Komisyon Dahil Satış Fiyatı",
    description: "Komisyon sonrası hedef net tutarı koruyacak satış fiyatını hesaplar.",
    riskLevel: "low",
    calculatorId: "commission-sale-price",
    inputs: [money("targetNet", "Hedef net tutar"), percentage("commissionPercent", "Komisyon")],
  },
  {
    id: "break-even-revenue",
    version: "1.0.0",
    category: "finance",
    title: "Başa Baş Ciro",
    description: "Sabit gider ve katkı marjına göre zarar etmeme cirosunu hesaplar.",
    riskLevel: "low",
    calculatorId: "break-even-revenue",
    inputs: [money("fixedCosts", "Aylık sabit gider"), percentage("contributionMarginPercent", "Katkı marjı")],
  },
  {
    id: "portion-cost",
    version: "1.0.0",
    category: "restaurant",
    title: "Porsiyon Maliyeti",
    description: "Malzeme, fire, ambalaj ve ek maliyetlerden porsiyon maliyetini hesaplar.",
    riskLevel: "low",
    calculatorId: "portion-cost",
    inputs: [money("ingredientCost", "Malzeme maliyeti"), percentage("wastePercent", "Fire oranı", false), money("packagingCost", "Ambalaj maliyeti", false), money("extraCost", "Diğer maliyet", false)],
  },
  {
    id: "marketplace-net-profit",
    version: "1.0.0",
    category: "ecommerce",
    title: "Pazaryeri Net Kâr",
    description: "Komisyon, kargo, reklam ve ürün maliyeti sonrası net kârı hesaplar.",
    riskLevel: "low",
    calculatorId: "marketplace-net-profit",
    inputs: [money("salePrice", "Satış fiyatı"), money("productCost", "Ürün maliyeti"), percentage("commissionPercent", "Komisyon"), money("shippingCost", "Kargo", false), money("adCost", "Reklam maliyeti", false)],
  },
  {
    id: "machine-payback",
    version: "1.0.0",
    category: "investment",
    title: "Makine Amortisman Süresi",
    description: "Makine yatırımının aylık net katkıyla kaç ayda geri döneceğini hesaplar.",
    riskLevel: "low",
    calculatorId: "machine-payback",
    inputs: [money("investmentCost", "Yatırım maliyeti"), money("monthlyNetContribution", "Aylık net katkı")],
  },
] as const;

export function getTool(toolId: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.id === toolId);
}

export function requiredInputKeys(tool: ToolDefinition): string[] {
  return tool.inputs.filter((input) => input.required).map((input) => input.key);
}
