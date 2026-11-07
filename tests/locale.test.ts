import { describe, expect, it } from "vitest";
import { resolveLocale } from "../src/lib/locale";

describe("resolveLocale", () => {
  it("follows a Spanish OS until a choice is stored", () => {
    expect(resolveLocale("es-ES", "en", false)).toBe("es");
    expect(resolveLocale("es-MX", "en", true)).toBe("en");
  });

  it("keeps an explicit English choice", () => {
    expect(resolveLocale("en-US", "en", false)).toBe("en");
    expect(resolveLocale("es-ES", "en", true)).toBe("en");
  });
});
