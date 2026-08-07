export type AssistantSessionContext = {
  toolId: string;
  toolTitle: string;
  inputs: Record<string, number>;
};

const MAX_HISTORY = 3;
let history: AssistantSessionContext[] = [];

function cloneContext(context: AssistantSessionContext): AssistantSessionContext {
  return {
    toolId: context.toolId,
    toolTitle: context.toolTitle,
    inputs: { ...context.inputs },
  };
}

export function setAssistantSession(context: AssistantSessionContext): void {
  history = [...history, cloneContext(context)].slice(-MAX_HISTORY);
}

export function getAssistantSession(): AssistantSessionContext | null {
  const current = history.at(-1);
  return current ? cloneContext(current) : null;
}

export function getAssistantSessionHistory(): AssistantSessionContext[] {
  return history.map(cloneContext);
}

export function clearAssistantSession(): void {
  history = [];
}
