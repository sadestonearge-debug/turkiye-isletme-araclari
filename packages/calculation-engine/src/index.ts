export type ProfitMarginInput = {
  cost: number;
  salePrice: number;
};

export type ProfitMarginOutput = {
  unitProfit: number;
  profitRatePercent: number;
  marginPercent: number;
  breakEvenPrice: number;
};

function assertPositiveFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number`);
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

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

export type TargetMarginPriceInput = {
  totalUnitCost: number;
  targetMarginPercent: number;
};

export type TargetMarginPriceOutput = {
  recommendedSalePrice: number;
};

export function calculateSalePriceForTargetMargin(
  input: TargetMarginPriceInput,
): TargetMarginPriceOutput {
  assertPositiveFinite("totalUnitCost", input.totalUnitCost);

  if (
    !Number.isFinite(input.targetMarginPercent) ||
    input.targetMarginPercent < 0 ||
    input.targetMarginPercent >= 100
  ) {
    throw new RangeError("targetMarginPercent must be between 0 (inclusive) and 100 (exclusive)");
  }

  return {
    recommendedSalePrice: roundMoney(
      input.totalUnitCost / (1 - input.targetMarginPercent / 100),
    ),
  };
}
