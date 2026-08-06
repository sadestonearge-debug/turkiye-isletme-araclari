function assertPositiveFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
}

function assertNonNegativeFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number`);
  }
}

function assertPercent(name: string, value: number, allowHundred = true): void {
  const maxOk = allowHundred ? value <= 100 : value < 100;
  if (!Number.isFinite(value) || value < 0 || !maxOk) {
    throw new RangeError(`${name} must be between 0 and ${allowHundred ? "100" : "100 (exclusive)"}`);
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type ProfitMarginInput = { cost: number; salePrice: number };
export type ProfitMarginOutput = {
  unitProfit: number;
  profitRatePercent: number;
  marginPercent: number;
  breakEvenPrice: number;
};

export function calculateProfitMargin(input: ProfitMarginInput): ProfitMarginOutput {
  assertPositiveFinite("cost", input.cost);
  assertPositiveFinite("salePrice", input.salePrice);
  const unitProfit = input.salePrice - input.cost;
  return {
    unitProfit: roundMoney(unitProfit),
    profitRatePercent: roundPercent((unitProfit / input.cost) * 100),
    marginPercent: roundPercent((unitProfit / input.salePrice) * 100),
    breakEvenPrice: roundMoney(input.cost),
  };
}

export type TargetMarginPriceInput = { totalUnitCost: number; targetMarginPercent: number };
export function calculateSalePriceForTargetMargin(input: TargetMarginPriceInput): { recommendedSalePrice: number } {
  assertPositiveFinite("totalUnitCost", input.totalUnitCost);
  assertPercent("targetMarginPercent", input.targetMarginPercent, false);
  return { recommendedSalePrice: roundMoney(input.totalUnitCost / (1 - input.targetMarginPercent / 100)) };
}

export type DiscountProfitInput = { cost: number; listPrice: number; discountPercent: number };
export function calculateDiscountProfit(input: DiscountProfitInput) {
  assertPositiveFinite("cost", input.cost);
  assertPositiveFinite("listPrice", input.listPrice);
  assertPercent("discountPercent", input.discountPercent);
  const discountedPrice = input.listPrice * (1 - input.discountPercent / 100);
  const unitProfit = discountedPrice - input.cost;
  return {
    discountedPrice: roundMoney(discountedPrice),
    unitProfit: roundMoney(unitProfit),
    marginPercent: discountedPrice === 0 ? 0 : roundPercent((unitProfit / discountedPrice) * 100),
  };
}

export type CommissionSalePriceInput = { targetNet: number; commissionPercent: number };
export function calculateCommissionSalePrice(input: CommissionSalePriceInput) {
  assertPositiveFinite("targetNet", input.targetNet);
  assertPercent("commissionPercent", input.commissionPercent, false);
  const salePrice = input.targetNet / (1 - input.commissionPercent / 100);
  return { requiredSalePrice: roundMoney(salePrice) };
}

export type BreakEvenRevenueInput = { fixedCosts: number; contributionMarginPercent: number };
export function calculateBreakEvenRevenue(input: BreakEvenRevenueInput) {
  assertPositiveFinite("fixedCosts", input.fixedCosts);
  assertPercent("contributionMarginPercent", input.contributionMarginPercent, false);
  if (input.contributionMarginPercent === 0) throw new RangeError("contributionMarginPercent must be greater than 0");
  return { breakEvenRevenue: roundMoney(input.fixedCosts / (input.contributionMarginPercent / 100)) };
}

export type PortionCostInput = {
  ingredientCost: number;
  wastePercent?: number;
  packagingCost?: number;
  extraCost?: number;
};
export function calculatePortionCost(input: PortionCostInput) {
  assertNonNegativeFinite("ingredientCost", input.ingredientCost);
  const wastePercent = input.wastePercent ?? 0;
  const packagingCost = input.packagingCost ?? 0;
  const extraCost = input.extraCost ?? 0;
  assertPercent("wastePercent", wastePercent);
  assertNonNegativeFinite("packagingCost", packagingCost);
  assertNonNegativeFinite("extraCost", extraCost);
  const ingredientsWithWaste = input.ingredientCost * (1 + wastePercent / 100);
  return {
    portionCost: roundMoney(ingredientsWithWaste + packagingCost + extraCost),
    wasteCost: roundMoney(ingredientsWithWaste - input.ingredientCost),
  };
}

export type MarketplaceNetProfitInput = {
  salePrice: number;
  productCost: number;
  commissionPercent: number;
  shippingCost?: number;
  adCost?: number;
};
export function calculateMarketplaceNetProfit(input: MarketplaceNetProfitInput) {
  assertPositiveFinite("salePrice", input.salePrice);
  assertNonNegativeFinite("productCost", input.productCost);
  assertPercent("commissionPercent", input.commissionPercent);
  const shippingCost = input.shippingCost ?? 0;
  const adCost = input.adCost ?? 0;
  assertNonNegativeFinite("shippingCost", shippingCost);
  assertNonNegativeFinite("adCost", adCost);
  const commissionCost = input.salePrice * (input.commissionPercent / 100);
  const netProfit = input.salePrice - input.productCost - commissionCost - shippingCost - adCost;
  return {
    commissionCost: roundMoney(commissionCost),
    netProfit: roundMoney(netProfit),
    netMarginPercent: roundPercent((netProfit / input.salePrice) * 100),
  };
}

export type MachinePaybackInput = { investmentCost: number; monthlyNetContribution: number };
export function calculateMachinePayback(input: MachinePaybackInput) {
  assertPositiveFinite("investmentCost", input.investmentCost);
  assertPositiveFinite("monthlyNetContribution", input.monthlyNetContribution);
  return { paybackMonths: Math.ceil(input.investmentCost / input.monthlyNetContribution) };
}
