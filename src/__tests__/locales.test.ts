import { describe, it, expect } from "vitest";
import {
  LOCALES,
  normalizeLocale,
  isRtl,
  getStrings,
  translateQuestion,
} from "@/lib/locales";

describe("locale helpers", () => {
  it("includes the 6 required locales", () => {
    expect(LOCALES).toEqual(["en", "ar", "fr", "de", "es", "pt"]);
  });

  it("normalizes unknown/empty values to en", () => {
    expect(normalizeLocale("zz")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
    expect(normalizeLocale("fr")).toBe("fr");
  });

  it("marks only Arabic as RTL", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
    expect(isRtl("fr")).toBe(false);
  });

  it("returns localized strings per locale", () => {
    expect(getStrings("fr").submit).toBe("Envoyer la réponse");
    expect(getStrings("de").yes).toBe("Ja");
    expect(getStrings("es").no).toBe("No");
    expect(getStrings("en").anonymous).toBe("100% anonymous");
  });

  it("builds localized email subjects", () => {
    expect(getStrings("fr").emailSubject("Pulse")).toContain("Pulse");
    expect(getStrings("pt").emailSubject("Pulse")).toContain("Pesquisa");
  });
});

describe("translateQuestion", () => {
  const translations = {
    questions: { "q1": { fr: "Question en français", ar: "سؤال بالعربية" } },
  };

  it("returns the base text for English", () => {
    expect(translateQuestion(translations, "q1", "Base", "en")).toBe("Base");
  });

  it("returns the translation when present", () => {
    expect(translateQuestion(translations, "q1", "Base", "fr")).toBe("Question en français");
  });

  it("falls back to base text when no translation exists", () => {
    expect(translateQuestion(translations, "q1", "Base", "de")).toBe("Base");
    expect(translateQuestion(translations, "q2", "Base", "fr")).toBe("Base");
  });

  it("falls back to base text when translations are malformed", () => {
    expect(translateQuestion(null, "q1", "Base", "fr")).toBe("Base");
    expect(translateQuestion("nope", "q1", "Base", "fr")).toBe("Base");
  });
});
