export type AssistantSessionContext = {
  toolId: string;
  toolTitle: string;
  inputs: Record<string, number>;
};

let currentContext: AssistantSessionContext | null = null;

export function setAssistantSession(context: AssistantSessionContext): void {
  currentContext = {
    toolId: context.toolId,
    toolTitle: context.toolTitle,
    inputs: { ...context.inputs },
  };
}

export function getAssistantSession(): AssistantSessionContext | null {
  return currentContext
    ? { ...currentContext, inputs: { ...currentContext.inputs } }
    : null;
}

export function clearAssistantSession(): void {
  currentContext = null;
}
