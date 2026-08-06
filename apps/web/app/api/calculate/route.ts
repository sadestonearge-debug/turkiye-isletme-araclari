import { NextResponse } from "next/server";
import { executeTool } from "@tia/tool-registry/execute";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { toolId?: unknown; values?: unknown } | null;

  if (!body || typeof body.toolId !== "string" || !body.values || typeof body.values !== "object") {
    return NextResponse.json({ ok: false, code: "invalid_request" }, { status: 400 });
  }

  const result = executeTool(body.toolId, body.values as Record<string, unknown>);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
