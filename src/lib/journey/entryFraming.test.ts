import { describe, it, expect } from "vitest";
import { entryFraming } from "./entryFraming";
import { AANYA, SANA, RIYA } from "@/data/pmosPersonas";
import type { Persona } from "@/types/persona";

// A persona with no PMOS profile (e.g. not women's-health eligible).
const NOT_ELIGIBLE = { pmos: undefined } as unknown as Persona;

describe("entryFraming", () => {
  it("returns null for non-eligible personas", () => {
    expect(entryFraming(NOT_ELIGIBLE)).toBeNull();
  });
  it("frames State A with flagged markers + high urgency", () => {
    const f = entryFraming(AANYA)!;
    expect(f.state).toBe("A");
    expect(f.urgency).toBe("high");
    expect(f.markers?.map((m) => m.label)).toEqual(expect.arrayContaining(["BMI", "HbA1c", "TSH"]));
  });
  it("frames State B as opt-in discovery, no markers", () => {
    const f = entryFraming(SANA)!;
    expect(f.state).toBe("B");
    expect(f.markers).toBeUndefined();
  });
  it("frames State C cold-start with low urgency", () => {
    const f = entryFraming(RIYA)!;
    expect(f.state).toBe("C");
    expect(f.urgency).toBe("low");
  });
});
