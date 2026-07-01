import { describe, it, expect } from "vitest";
import { ovulationDay, phaseForCycleDay, hormoneTemplateDay } from "./cycleview";

describe("ovulationDay", () => {
  it("counts back 14 days from the next period (fixed luteal), not the midpoint", () => {
    expect(ovulationDay(21)).toBe(7);
    expect(ovulationDay(28)).toBe(14);
    expect(ovulationDay(40)).toBe(26);
    expect(ovulationDay(90)).toBe(76);
    expect(ovulationDay(20)).toBe(6);
  });
  it("never returns a non-positive day", () => {
    expect(ovulationDay(10)).toBeGreaterThanOrEqual(1);
  });
});

describe("phaseForCycleDay", () => {
  it("makes the menstrual band the entered period duration, not a fixed 5", () => {
    expect(phaseForCycleDay(4, 28, 4)).toBe("menstrual");
    expect(phaseForCycleDay(5, 28, 4)).toBe("follicular"); // day 5 is no longer 'period' for a 4-day period
    expect(phaseForCycleDay(7, 28, 7)).toBe("menstrual");
  });

  it("anchors the ovulatory band on L-14 for a normal cycle", () => {
    expect(phaseForCycleDay(5, 28, 5)).toBe("menstrual");
    expect(phaseForCycleDay(6, 28, 5)).toBe("follicular");
    expect(phaseForCycleDay(14, 28, 5)).toBe("ovulatory"); // ovCd = 14
    expect(phaseForCycleDay(20, 28, 5)).toBe("luteal");
  });

  it("anchors the ovulatory band on L-14 for a long cycle (day 26, not 20)", () => {
    expect(phaseForCycleDay(24, 40, 5)).toBe("follicular");
    expect(phaseForCycleDay(26, 40, 5)).toBe("ovulatory"); // ovCd = 26
    expect(phaseForCycleDay(29, 40, 5)).toBe("luteal");
    expect(phaseForCycleDay(40, 40, 5)).toBe("luteal");
  });

  it("handles short cycles (early ovulation)", () => {
    // L=21 -> ovCd=7, ovStart=6, ovEnd=9
    expect(phaseForCycleDay(4, 21, 4)).toBe("menstrual");
    expect(phaseForCycleDay(5, 21, 4)).toBe("follicular");
    expect(phaseForCycleDay(7, 21, 4)).toBe("ovulatory");
    expect(phaseForCycleDay(10, 21, 4)).toBe("luteal");
  });

  it("defaults the period length to 5 when duration is omitted", () => {
    expect(phaseForCycleDay(5, 28)).toBe("menstrual");
    expect(phaseForCycleDay(6, 28)).toBe("follicular");
  });
});

describe("hormoneTemplateDay", () => {
  it("is the identity for a 28-day cycle (template is already 28-day)", () => {
    expect(hormoneTemplateDay(1, 28)).toBeCloseTo(1);
    expect(hormoneTemplateDay(14, 28)).toBeCloseTo(14);
    expect(hormoneTemplateDay(28, 28)).toBeCloseTo(28);
    expect(hormoneTemplateDay(7, 28)).toBeCloseTo(7);
  });

  it("maps ovulation day to template day 14 and cycle end to 28", () => {
    // L=40 -> ovCd=26
    expect(hormoneTemplateDay(1, 40)).toBeCloseTo(1);
    expect(hormoneTemplateDay(26, 40)).toBeCloseTo(14);
    expect(hormoneTemplateDay(40, 40)).toBeCloseTo(28);
    // L=21 -> ovCd=7
    expect(hormoneTemplateDay(7, 21)).toBeCloseTo(14);
    expect(hormoneTemplateDay(21, 21)).toBeCloseTo(28);
  });

  it("stretches the follicular half and maps the luteal half ~1:1", () => {
    // L=40, ovCd=26: a luteal day is offset the same in template space
    expect(hormoneTemplateDay(30, 40)).toBeCloseTo(18); // 14 + (30-26)
    expect(hormoneTemplateDay(33, 40)).toBeCloseTo(21); // 14 + (33-26)
  });
});
