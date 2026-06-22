import { describe, it, expect } from "vitest";
import { getPhase } from "./phase";

describe("getPhase", () => {
  it("maps day 0 to entry", () => { expect(getPhase(0)).toBe("entry"); });
  it("maps the foundation window", () => {
    expect(getPhase(1)).toBe("foundation");
    expect(getPhase(28)).toBe("foundation");
  });
  it("maps the build window", () => {
    expect(getPhase(29)).toBe("build");
    expect(getPhase(90)).toBe("build");
  });
  it("maps the consolidate window", () => {
    expect(getPhase(91)).toBe("consolidate");
    expect(getPhase(150)).toBe("consolidate");
  });
  it("maps the review window", () => {
    expect(getPhase(151)).toBe("review");
    expect(getPhase(182)).toBe("review");
  });
  it("clamps out-of-range days", () => {
    expect(getPhase(-5)).toBe("entry");
    expect(getPhase(999)).toBe("review");
  });
});
