import { afterEach, describe, expect, it } from "vitest";
import {
  clearAssistantSession,
  getAssistantSession,
  getAssistantSessionHistory,
  setAssistantSession,
} from "./assistant-session";

afterEach(() => clearAssistantSession());

describe("in-memory assistant session", () => {
  it("stores defensive copies of verified calculator inputs", () => {
    const inputs = { cost: 100, salePrice: 160 };
    setAssistantSession({ toolId: "profit-margin", toolTitle: "Kâr Marjı Hesaplama", inputs });
    inputs.cost = 999;

    expect(getAssistantSession()).toEqual({
      toolId: "profit-margin",
      toolTitle: "Kâr Marjı Hesaplama",
      inputs: { cost: 100, salePrice: 160 },
    });
  });

  it("keeps only the latest three verified calculator contexts", () => {
    setAssistantSession({ toolId: "a", toolTitle: "A", inputs: { a: 1 } });
    setAssistantSession({ toolId: "b", toolTitle: "B", inputs: { b: 2 } });
    setAssistantSession({ toolId: "c", toolTitle: "C", inputs: { c: 3 } });
    setAssistantSession({ toolId: "d", toolTitle: "D", inputs: { d: 4 } });

    expect(getAssistantSessionHistory().map((item) => item.toolId)).toEqual(["b", "c", "d"]);
    expect(getAssistantSession()?.toolId).toBe("d");
  });

  it("clears without persistence", () => {
    setAssistantSession({ toolId: "profit-margin", toolTitle: "Kâr Marjı Hesaplama", inputs: { cost: 100 } });
    clearAssistantSession();
    expect(getAssistantSession()).toBeNull();
    expect(getAssistantSessionHistory()).toEqual([]);
  });
});
