import type { ToolPageDefinition } from "./tools";

export type PrefillValues = Record<string, number>;

export function sanitizeExtractedInputs(
  tool: ToolPageDefinition,
  extracted: Record<string, unknown> | null | undefined,
): PrefillValues {
  if (!extracted) return {};

  const allowed = new Set(tool.inputs.map((input) => input.key));
  const values: PrefillValues = {};

  for (const [key, raw] of Object.entries(extracted)) {
    if (!allowed.has(key) || typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) continue;
    values[key] = raw;
  }

  return values;
}

export function parsePrefillSearchParams(
  tool: ToolPageDefinition,
  searchParams: Record<string, string | string[] | undefined>,
): PrefillValues {
  const allowed = new Set(tool.inputs.map((input) => input.key));
  const values: PrefillValues = {};

  for (const [key, raw] of Object.entries(searchParams)) {
    if (!allowed.has(key) || Array.isArray(raw) || raw === undefined || raw.trim() === "") continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) continue;
    values[key] = value;
  }

  return values;
}

export function buildPrefillQuery(values: PrefillValues): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) params.set(key, String(value));
  return params.toString();
}
