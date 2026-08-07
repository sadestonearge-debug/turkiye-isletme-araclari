export type ChatSuggestion = {
  label: string;
  message: string;
};

const SUGGESTIONS: Readonly<Record<string, readonly ChatSuggestion[]>> = {
  "profit-margin": [
    { label: "%10 indirim", message: "%10 indirim" },
    { label: "%20 komisyon", message: "%20 komisyon" },
  ],
  "discount-profit": [
    { label: "%15 indirim", message: "%15 indirim" },
    { label: "%20 komisyon", message: "%20 komisyon" },
  ],
  "marketplace-net-profit": [
    { label: "Komisyon %18", message: "komisyon %18" },
    { label: "%10 indirim", message: "%10 indirim" },
  ],
};

export function getChatSuggestions(toolId: string): readonly ChatSuggestion[] {
  return SUGGESTIONS[toolId] ?? [];
}
