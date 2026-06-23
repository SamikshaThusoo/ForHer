import { describe, it, expect } from "vitest";
import { getPhase } from "./phase";

describe("getPhase (90-day, 3 phases)", () => {
  it("maps the foundation window (1-30)", () => {
    expect(getPhase(1)).toBe("foundation");
    expect(getPhase(30)).toBe("foundation");
  });
  it("maps the build window (31-60)", () => {
    expect(getPhase(31)).toBe("build");
    expect(getPhase(60)).toBe("build");
  });
  it("maps the milestone window (61-90)", () => {
    expect(getPhase(61)).toBe("milestone");
    expect(getPhase(90)).toBe("milestone");
  });
  it("clamps out-of-range days", () => {
    expect(getPhase(0)).toBe("foundation");
    expect(getPhase(-5)).toBe("foundation");
    expect(getPhase(120)).toBe("milestone");
  });
});
