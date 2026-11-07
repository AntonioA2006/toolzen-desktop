import { describe, expect, it } from "vitest";
import { integerBounds, optionProblem } from "../src/tools/mvp/options";
import type { ToolOptionField } from "../src/tools/mvp/specs";

const field = (partial: ToolOptionField): ToolOptionField => partial;

describe("tool option constraints", () => {
  it("keeps rotation, size, crop origin, and page syntax", () => {
    expect(optionProblem(field({ name: "rotation", label: "Rotation", kind: "integer", required: true }), "45")).toBe("err_rotation");
    expect(optionProblem(field({ name: "rotation", label: "Rotation", kind: "integer", required: true }), "180")).toBeNull();
    expect(optionProblem(field({ name: "width", label: "Width", kind: "integer", required: true }), "0")).toBe("err_dimension");
    expect(optionProblem(field({ name: "x", label: "X", kind: "integer", required: true }), "-1")).toBe("err_origin");
    expect(optionProblem(field({ name: "pages", label: "Pages", kind: "text", required: true }), "1,3-5")).toBeNull();
    expect(optionProblem(field({ name: "pages", label: "Pages", kind: "text", required: false }), "")).toBeNull();
    expect(integerBounds("rotation")).toEqual({ min: 90, max: 270, step: 90 });
  });
});
