import { describe, expect, it } from "vitest";
import { parseRoute } from "../src/types/route";

describe("routes", () => {
  it("accepts the privacy screen and rejects an unknown name", () => {
    expect(parseRoute({ name: "privacy" })).toEqual({ name: "privacy" });
    expect(parseRoute({ name: "billing" })).toBeNull();
  });
});
