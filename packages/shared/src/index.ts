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

export type ToolInputType = "number" | "percentage" | "money" | "integer";

export type ToolInputDefinition = {
  key: string;
  label: string;
  type: ToolInputType;
  required: boolean;
  min?: number;
  max?: number;
};

export type ToolDefinition = {
  id: string;
  version: string;
  category: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  calculatorId: string;
  inputs: readonly ToolInputDefinition[];
};

export type ToolSelection = {
  toolId: string | null;
  confidence: number;
  extractedInputs: Record<string, string | number | boolean>;
  missingInputs: string[];
};

export type AuditMeta = {
  requestId: string;
  provider: string;
  model: string;
  promptVersion: string;
  selectedTool: string | null;
  toolVersion: string | null;
  confidence: number;
  resultHash: string | null;
  fallbackUsed: boolean;
  createdAt: string;
};
