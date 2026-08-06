import { createGeminiResultExplainer, isRegisteredTool } from "@tia/ai-core";
import { NextResponse } from "next/server";

function isNumericRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.length <= 12 && entries.every(([key, item]) => key.length <= 64 && typeof item === "number" && Number.isFinite(item));
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { toolId?: unknown; inputs?: unknown; result?: unknown };
    if (typeof body.toolId !== "string" || !isRegisteredTool(body.toolId) || !isNumericRecord(body.inputs) || !isNumericRecord(body.result)) {
      return NextResponse.json({ ok: false, available: false }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ ok: true, available: false });

    const explainer = createGeminiResultExplainer({ apiKey, model: process.env.GEMINI_MODEL });
    const explanation = await explainer.explain(body.toolId, body.inputs, body.result);
    return NextResponse.json({ ok: true, available: true, source: "gemini", explanation });
  } catch {
    return NextResponse.json({ ok: true, available: false });
  }
}
