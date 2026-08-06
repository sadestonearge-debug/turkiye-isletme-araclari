import type { ToolDefinition } from "../../shared/src/index";

export type ValidationIssue = {
  field: string;
  code: "missing" | "invalid_type" | "below_min" | "above_max";
  message: string;
};

export type ValidationResult =
  | { ok: true; values: Record<string, number> }
  | { ok: false; issues: ValidationIssue[] };

export function validateToolInputs(
  tool: ToolDefinition,
  candidate: Record<string, unknown>,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const values: Record<string, number> = {};

  for (const input of tool.inputs) {
    const raw = candidate[input.key];

    if (raw === undefined || raw === null || raw === "") {
      if (input.required) {
        issues.push({ field: input.key, code: "missing", message: `${input.label} gerekli.` });
      }
      continue;
    }

    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(value)) {
      issues.push({ field: input.key, code: "invalid_type", message: `${input.label} sayısal olmalı.` });
      continue;
    }

    if (input.min !== undefined && value < input.min) {
      issues.push({ field: input.key, code: "below_min", message: `${input.label} en az ${input.min} olmalı.` });
      continue;
    }

    if (input.max !== undefined && value > input.max) {
      issues.push({ field: input.key, code: "above_max", message: `${input.label} en fazla ${input.max} olmalı.` });
      continue;
    }

    values[input.key] = value;
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, values };
}
