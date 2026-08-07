import { afterEach, describe, expect, it } from "vitest";
import { clearAssistantSession, getAssistantSession, setAssistantSession } from "./assistant-session";

afterEach(() => clearAssistantSession());

describe("in-memory assistant session", () => {
  it("stores a defensive copy of verified calculator inputs", () => {
    const inputs = { cost: 100, salePrice: 160 };
    setAssistantSession({ toolId: "profit-margin", toolTitle: "Kâr Marjı Hesaplama", inputs });
    inputs.cost = 999;

    expect(getAssistantSession()).toEqual({
      toolId: "profit-margin",
      toolTitle: "Kâr Marjı Hesaplama",
      inputs: { cost: 100, salePrice: 160 },
    });
  });

  it("clears without persistence", () => {
    setAssistantSession({ toolId: "profit-margin", toolTitle: "Kâr Marjı Hesaplama", inputs: { cost: 100 } });
    clearAssistantSession();
    expect(getAssistantSession()).toBeNull();
  });
});
