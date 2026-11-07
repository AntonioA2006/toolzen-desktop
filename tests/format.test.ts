import { describe, expect, it } from "vitest";
import { base64Bytes, categoryAvailability, formatLocal } from "../src/lib/format";

describe("locale formatting", () => {
  it("uses Spanish wording without English AM/PM", () => {
    const text = formatLocal("es", "2026-11-07T15:30:00.000Z");
    expect(text.includes("AM")).toBe(false);
    expect(text.includes("PM")).toBe(false);
    expect(categoryAvailability("es", 1, 1, 1)).toBe("1 disponible · 1 parcial · 1 no incluida");
    expect(categoryAvailability("es", 4, 0, 6)).toBe("4 disponibles · 0 parciales · 6 no incluidas");
    expect(categoryAvailability("en", 1, 0, 1)).toBe("1 ready · 0 partials · 1 not included");
  });

  it("does not force UTC", () => {
    const source = formatLocal.toString();
    expect(source.includes("timeZone")).toBe(false);
    expect(base64Bytes("YQ==")).toBe(1);
  });
});
