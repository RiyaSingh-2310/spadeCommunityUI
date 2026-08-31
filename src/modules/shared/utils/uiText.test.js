import { describe, expect, it } from "vitest";
import { shouldPreserveUiCasing, toUiSentenceCase } from "./uiText";

describe("toUiSentenceCase", () => {
  it("formats inconsistent casing into sentence case", () => {
    expect(toUiSentenceCase("english")).toBe("English");
    expect(toUiSentenceCase("ENGLISH")).toBe("English");
    expect(toUiSentenceCase("gERMAN")).toBe("German");
    expect(toUiSentenceCase("STATUS")).toBe("Status");
    expect(toUiSentenceCase("RIGHT ANSWER")).toBe("Right answer");
    expect(toUiSentenceCase("QUESTION TITLE")).toBe("Question title");
    expect(toUiSentenceCase("Survey Title")).toBe("Survey title");
  });

  it("preserves acronyms in labels", () => {
    expect(toUiSentenceCase("Website URL")).toBe("Website URL");
    expect(toUiSentenceCase("S.No")).toBe("S.No");
  });

  it("preserves URLs, emails, and technical identifiers", () => {
    expect(shouldPreserveUiCasing("http://localhost:5173/public")).toBe(true);
    expect(shouldPreserveUiCasing("demo@example.com")).toBe(true);
    expect(toUiSentenceCase("demo@example.com")).toBe("demo@example.com");
    expect(toUiSentenceCase("http://localhost:5173/x")).toBe("http://localhost:5173/x");
  });
});
