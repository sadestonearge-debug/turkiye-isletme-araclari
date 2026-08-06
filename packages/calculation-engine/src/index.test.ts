import { describe, expect, it } from "vitest";
import {
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
    expect(
      calculateSalePriceForTargetMargin({
        totalUnitCost: 145,
        targetMarginPercent: 30,
      }),
    ).toEqual({ recommendedSalePrice: 207.14 });
  });

  it("rejects invalid financial inputs", () => {
    expect(() => calculateProfitMargin({ cost: 0, salePrice: 100 })).toThrow(
      RangeError,
    );
    expect(() =>
      calculateSalePriceForTargetMargin({
        totalUnitCost: 100,
        targetMarginPercent: 100,
      }),
    ).toThrow(RangeError);
  });
});
