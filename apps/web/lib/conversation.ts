import type { ToolPageDefinition } from "./tools";

export function parseSingleNumber(message: string): number | null {
  const raw = message.match(/-?\d[\d.,]*/)?.[0];
  if (!raw) return null;

  let normalized = raw;
  if (raw.includes(",")) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
    normalized = raw.replace(/\./g, "");
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export function getInputLabel(tool: ToolPageDefinition, key: string): string {
  return tool.inputs.find((input) => input.key === key)?.label ?? key;
}

export function nextMissingInput(tool: ToolPageDefinition, values: Record<string, number>): string | null {
  for (const input of tool.inputs) {
    if (values[input.key] === undefined) return input.key;
  }
  return null;
}

export function mergeFollowUpValue(
  tool: ToolPageDefinition,
  values: Record<string, number>,
  missingKey: string,
  message: string,
): { values: Record<string, number>; accepted: boolean; nextMissing: string | null } {
  if (!tool.inputs.some((input) => input.key === missingKey)) {
    return { values, accepted: false, nextMissing: nextMissingInput(tool, values) };
  }

  const value = parseSingleNumber(message);
  if (value === null) {
    return { values, accepted: false, nextMissing: missingKey };
  }

  const merged = { ...values, [missingKey]: value };
  return { values: merged, accepted: true, nextMissing: nextMissingInput(tool, merged) };
}
