import { describe, expect, it } from "vitest";
import { getFaqs, REVIEWED_AT } from "./seo-content";
import { toolPages } from "./tools";

describe("SEO content", () => {
  it("has valid review metadata", () => {
    expect(REVIEWED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("provides at least four visible FAQs for every published tool", () => {
    for (const tool of toolPages) {
      const faqs = getFaqs(tool.id);
      expect(faqs.length).toBeGreaterThanOrEqual(4);
      expect(new Set(faqs.map((faq) => faq.question)).size).toBe(faqs.length);
      for (const faq of faqs) {
        expect(faq.question.trim().length).toBeGreaterThan(8);
        expect(faq.answer.trim().length).toBeGreaterThan(20);
      }
    }
  });
});
