import { describe, it, expect } from "vitest";
import { bmiFrom } from "./healthprofile";

describe("bmiFrom", () => {
  it("computes BMI to one decimal from height + weight", () => {
    expect(bmiFrom({ heightCm: 160, weightKg: 64 })).toBe(25); // 64 / 1.6^2
  });
  it("returns null when height or weight is missing or non-positive", () => {
    expect(bmiFrom({ weightKg: 64 })).toBeNull();
    expect(bmiFrom({ heightCm: 0, weightKg: 64 })).toBeNull();
    expect(bmiFrom({})).toBeNull();
  });
});
