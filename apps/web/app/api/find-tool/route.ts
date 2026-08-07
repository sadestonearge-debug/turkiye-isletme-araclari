import { NextResponse } from "next/server";
import { createRuleBasedAiCore } from "@tia/ai-core";
import { createProviderBackedAiCore } from "@tia/ai-core/provider";
import { createGeminiRoutingProvider } from "@tia/ai-core/gemini";
import { sanitizeExtractedInputs } from "../../../lib/prefill";
import { toolPages } from "../../../lib/tools";

function createRouter() {
  const fallback = createRuleBasedAiCore();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return fallback;

  return createProviderBackedAiCore(
    createGeminiRoutingProvider({
      apiKey,
      model: process.env.GEMINI_MODEL,
    }),
    fallback,
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { message?: unknown } | null;
  if (!body || typeof body.message !== "string" || body.message.trim().length < 3 || body.message.length > 500) {
    return NextResponse.json({ ok: false, code: "invalid_request" }, { status: 400 });
  }

  const selection = await createRouter().selectTool(body.message.trim());
  if (!selection.toolId) {
    return NextResponse.json({ ok: true, match: null });
  }

  const page = toolPages.find((tool) => tool.id === selection.toolId);
  if (!page) return NextResponse.json({ ok: true, match: null });

  return NextResponse.json({
    ok: true,
    match: {
      slug: page.slug,
      title: page.title,
      description: page.description,
      confidence: selection.confidence,
      extractedInputs: sanitizeExtractedInputs(page, selection.extractedInputs),
      missingInputs: selection.missingInputs.filter((key) => page.inputs.some((input) => input.key === key)),
    },
  });
}
