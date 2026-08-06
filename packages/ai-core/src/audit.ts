import { createHash, randomUUID } from "node:crypto";
import type { AuditMeta } from "../../shared/src/index";

export function hashResult(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function createAuditMeta(input: {
  provider: string;
  model: string;
  promptVersion: string;
  selectedTool: string | null;
  toolVersion: string | null;
  confidence: number;
  result?: unknown;
  fallbackUsed: boolean;
}): AuditMeta {
  return {
    requestId: randomUUID(),
    provider: input.provider,
    model: input.model,
    promptVersion: input.promptVersion,
    selectedTool: input.selectedTool,
    toolVersion: input.toolVersion,
    confidence: input.confidence,
    resultHash: input.result === undefined ? null : hashResult(input.result),
    fallbackUsed: input.fallbackUsed,
    createdAt: new Date().toISOString(),
  };
}
