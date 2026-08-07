import { describe, expect, it } from "vitest";
import { getChatSuggestions } from "./chat-suggestions";

describe("chat result suggestions", () => {
  it("offers supported next actions after profit margin", () => {
    expect(getChatSuggestions("profit-margin")).toEqual([
      { label: "%10 indirim", message: "%10 indirim" },
      { label: "%20 komisyon", message: "%20 komisyon" },
    ]);
  });

  it("offers contextual actions after discount and marketplace calculations", () => {
    expect(getChatSuggestions("discount-profit").map((item) => item.message)).toEqual(["%15 indirim", "%20 komisyon"]);
    expect(getChatSuggestions("marketplace-net-profit").map((item) => item.message)).toEqual(["komisyon %18", "%10 indirim"]);
  });

  it("returns no suggestions for unsupported calculators", () => {
    expect(getChatSuggestions("machine-payback")).toEqual([]);
  });
});
