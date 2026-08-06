import { describe, expect, it } from "vitest";
import {
  calculateBreakEvenRevenue,
  calculateCommissionSalePrice,
  calculateDiscountProfit,
  calculateMachinePayback,
  calculateMarketplaceNetProfit,
  calculatePortionCost,
  calculateProfitMargin,
  calculateSalePriceForTargetMargin,
} from "./index";

describe("calculation engine", () => {
  it("calculates profit rate and margin deterministically", () => {
    expect(calculateProfitMargin({ cost: 100, salePrice: 160 })).toEqual({
      unitProfit: 60,
      profitRatePercent: 60,
      marginPercent: 37.5,
      breakEvenPrice: 100,
    });
  });

  it("calculates a sale price for a target margin", () => {
    expect(calculateSalePriceForTargetMargin({ totalUnitCost: 145, targetMarginPercent: 30 })).toEqual({
      recommendedSalePrice: 207.14,
    });
  });

  it("calculates discount profitability", () => {
    expect(calculateDiscountProfit({ cost: 100, listPrice: 200, discountPercent: 10 })).toEqual({
      discountedPrice: 180,
      unitProfit: 80,
      marginPercent: 44.44,
    });
  });

  it("calculates commission protected sale price", () => {
    expect(calculateCommissionSalePrice({ targetNet: 100, commissionPercent: 20 })).toEqual({
      requiredSalePrice: 125,
    });
  });

  it("calculates break even revenue", () => {
    expect(calculateBreakEvenRevenue({ fixedCosts: 300000, contributionMarginPercent: 60 })).toEqual({
      breakEvenRevenue: 500000,
    });
  });

  it("calculates portion cost with waste", () => {
    expect(calculatePortionCost({ ingredientCost: 50, wastePercent: 10, packagingCost: 5, extraCost: 2 })).toEqual({
      portionCost: 62,
      wasteCost: 5,
    });
  });

  it("calculates marketplace net profit", () => {
    expect(calculateMarketplaceNetProfit({ salePrice: 500, productCost: 200, commissionPercent: 20, shippingCost: 50, adCost: 25 })).toEqual({
      commissionCost: 100,
      netProfit: 125,
      netMarginPercent: 25,
    });
  });

  it("calculates machine payback in whole months", () => {
    expect(calculateMachinePayback({ investmentCost: 100000, monthlyNetContribution: 12000 })).toEqual({
      paybackMonths: 9,
    });
  });

  it("rejects invalid financial inputs", () => {
    expect(() => calculateProfitMargin({ cost: 0, salePrice: 100 })).toThrow(RangeError);
    expect(() => calculateSalePriceForTargetMargin({ totalUnitCost: 100, targetMarginPercent: 100 })).toThrow(RangeError);
    expect(() => calculateBreakEvenRevenue({ fixedCosts: 100, contributionMarginPercent: 0 })).toThrow(RangeError);
  });
});
