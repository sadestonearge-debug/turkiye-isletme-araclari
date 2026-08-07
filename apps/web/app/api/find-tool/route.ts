import { NextResponse } from "next/server";
import { createRuleBasedAiCore } from "@tia/ai-core";
import { createProviderBackedAiCore } from "@tia/ai-core/provider";
import { createGeminiRoutingProvider } from "@tia/ai-core/gemini";
import { buildContextualRoutingMessage, sanitizePreviousContext } from "../../../lib/assistant-context";
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
  const body = await request.json().catch(() => null) as { message?: unknown; previousContext?: unknown } | null;
  if (!body || typeof body.message !== "string" || body.message.trim().length < 3 || body.message.length > 500) {
    return NextResponse.json({ ok: false, code: "invalid_request" }, { status: 400 });
  }

  const previousContext = sanitizePreviousContext(body.previousContext);
  const routingMessage = buildContextualRoutingMessage(body.message.trim(), previousContext);
  const selection = await createRouter().selectTool(routingMessage);
  if (!selection.toolId) {
    return NextResponse.json({ ok: true, match: null });
  }

  const page = toolPages.find((tool) => tool.id === selection.toolId);
  if (!page) return NextResponse.json({ ok: true, match: null });

  const extractedInputs = sanitizeExtractedInputs(page, selection.extractedInputs);
  const missingInputs = page.inputs
    .filter((input) => extractedInputs[input.key] === undefined)
    .map((input) => ({ key: input.key, label: input.label, suffix: input.suffix ?? null }));

  return NextResponse.json({
    ok: true,
    contextual: Boolean(previousContext),
    match: {
      toolId: page.id,
      slug: page.slug,
      title: page.title,
      description: page.description,
      confidence: selection.confidence,
      extractedInputs,
      missingInputs,
    },
  });
}
