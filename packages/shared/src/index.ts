export type RiskLevel = "low" | "regulated";

export type Money = {
  amount: number;
  currency: "TRY";
};

export type CalculationMeta = {
  calculatorId: string;
  calculatorVersion: string;
};

export type CalculationResult<T> = {
  data: T;
  meta: CalculationMeta;
};

export type ToolDefinition = {
  id: string;
  version: string;
  category: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  calculatorId: string;
  requiredInputs: readonly string[];
};

export type ToolSelection = {
  toolId: string | null;
  confidence: number;
  extractedInputs: Record<string, string | number | boolean>;
  missingInputs: string[];
};
