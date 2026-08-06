import {
  calculateBreakEvenRevenue,
  calculateCommissionSalePrice,
  calculateDiscountProfit,
  calculateMachinePayback,
  calculateMarketplaceNetProfit,
  calculatePortionCost,
  calculateProfitMargin,
  calculateSalePriceForTargetMargin,
} from "../../calculation-engine/src/index";
import { getTool } from "./index";
import { validateToolInputs } from "./validate";

export type ToolExecutionResult =
  | { ok: true; toolId: string; toolVersion: string; result: unknown }
  | { ok: false; code: "unknown_tool" | "invalid_input"; issues?: unknown };

export function executeTool(toolId: string, candidate: Record<string, unknown>): ToolExecutionResult {
  const tool = getTool(toolId);
  if (!tool) return { ok: false, code: "unknown_tool" };

  const validation = validateToolInputs(tool, candidate);
  if (!validation.ok) return { ok: false, code: "invalid_input", issues: validation.issues };

  const v = validation.values;
  let result: unknown;

  switch (tool.calculatorId) {
    case "profit-margin":
      result = calculateProfitMargin({ cost: v.cost!, salePrice: v.salePrice! });
      break;
    case "target-margin-sale-price":
      result = calculateSalePriceForTargetMargin({ totalUnitCost: v.totalUnitCost!, targetMarginPercent: v.targetMarginPercent! });
      break;
    case "discount-profit":
      result = calculateDiscountProfit({ cost: v.cost!, listPrice: v.listPrice!, discountPercent: v.discountPercent! });
      break;
    case "commission-sale-price":
      result = calculateCommissionSalePrice({ targetNet: v.targetNet!, commissionPercent: v.commissionPercent! });
      break;
    case "break-even-revenue":
      result = calculateBreakEvenRevenue({ fixedCosts: v.fixedCosts!, contributionMarginPercent: v.contributionMarginPercent! });
      break;
    case "portion-cost":
      result = calculatePortionCost({
        ingredientCost: v.ingredientCost!,
        ...(v.wastePercent !== undefined ? { wastePercent: v.wastePercent } : {}),
        ...(v.packagingCost !== undefined ? { packagingCost: v.packagingCost } : {}),
        ...(v.extraCost !== undefined ? { extraCost: v.extraCost } : {}),
      });
      break;
    case "marketplace-net-profit":
      result = calculateMarketplaceNetProfit({
        salePrice: v.salePrice!,
        productCost: v.productCost!,
        commissionPercent: v.commissionPercent!,
        ...(v.shippingCost !== undefined ? { shippingCost: v.shippingCost } : {}),
        ...(v.adCost !== undefined ? { adCost: v.adCost } : {}),
      });
      break;
    case "machine-payback":
      result = calculateMachinePayback({ investmentCost: v.investmentCost!, monthlyNetContribution: v.monthlyNetContribution! });
      break;
    default:
      return { ok: false, code: "unknown_tool" };
  }

  return { ok: true, toolId: tool.id, toolVersion: tool.version, result };
}
