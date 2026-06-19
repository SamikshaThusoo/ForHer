import { describe, it, expect } from "vitest";
import { verdictFor } from "./personalize";
import type { FoodItem } from "@/types/food";
import type { Persona } from "@/types/persona";

const aanyaLike: Pick<Persona, "smartReport" | "cares"> = {
  smartReport: {
    healthScore: 560, band: "warm", bandLabel: "Fair",
    chronologicalAge: 28, biologicalAge: 31, heartAge: 30,
    cvdRiskPct: 2, diabetesRiskPct: 8, hypertensionRiskPct: 6,
    populationAvgScore: 738, topDrivers: [],
    labs: [{ key: "hba1c", label: "HbA1c", value: 6.0, unit: "%", status: "flagged" }],
  },
  cares: { enrolled: true, primaryProgram: "pcos-care", weekOfTwelve: 1 },
};

const sugaryBiscuit: FoodItem = {
  id: "f-biscuit", name: "Cream Biscuits", category: "packaged",
  per100g: { energyKcal: 480, carbsG: 64, sugarG: 30, proteinG: 5, fatG: 22, fiberG: 1, sodiumMg: 300 },
  diseaseTags: { diabetes: "flagged", hypertension: "normal", cvd: "borderline", pcos: "flagged" },
};

const dalBowl: FoodItem = {
  id: "f-dal", name: "Dal Bowl", category: "indian-meal",
  per100g: { energyKcal: 180, carbsG: 20, sugarG: 2, proteinG: 11, fatG: 5, fiberG: 6, sodiumMg: 320 },
  diseaseTags: { diabetes: "normal", hypertension: "normal", cvd: "normal", pcos: "normal" },
};

describe("verdictFor (PCOS-centric)", () => {
  it("flags a high-sugar food with an insulin/sugar-anchored reason + swap", () => {
    const v = verdictFor(sugaryBiscuit, aanyaLike as Persona);
    expect(v.forYou).toBe("avoid"); // sugar >= 15 → worst score
    expect(v.oneLineReason).toMatch(/sugar/i);
    expect(v.swap).toBeDefined();
  });

  it("rates a protein + fibre meal as a good choice", () => {
    const v = verdictFor(dalBowl, aanyaLike as Persona);
    expect(["great", "ok"]).toContain(v.forYou);
    expect(v.swap).toBeUndefined();
  });
});
