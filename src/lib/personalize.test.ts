import { describe, it, expect } from "vitest";
import { verdictFor } from "./personalize";
import type { FoodItem } from "@/types/food";
import type { Persona } from "@/types/persona";

const priya: Pick<Persona, "smartReport" | "cares"> = {
  smartReport: {
    healthScore: 620, band: "warm", bandLabel: "Fair",
    chronologicalAge: 34, biologicalAge: 38, heartAge: 40,
    cvdRiskPct: 4.2, diabetesRiskPct: 12.0, hypertensionRiskPct: 8.0,
    populationAvgScore: 738, topDrivers: ["prediabetes", "vitamin D", "borderline BP"],
    labs: [
      { key: "hba1c", label: "HbA1c", value: 5.9, unit: "%", status: "flagged" },
      { key: "sbp",   label: "Systolic BP", value: 134, unit: "mmHg", status: "borderline" },
    ],
  },
  cares: { enrolled: true, primaryProgram: "prediabetes-reversal", weekOfTwelve: 3 },
};

const biryani: FoodItem = {
  id: "f-biryani", name: "Chicken Biryani", category: "indian-meal",
  per100g: { energyKcal: 290, carbsG: 38, sugarG: 1, proteinG: 12, fatG: 10, fiberG: 1, sodiumMg: 550 },
  diseaseTags: { diabetes: "flagged", hypertension: "borderline", cvd: "borderline", pcos: "borderline" },
};

describe("verdictFor", () => {
  it("flags biryani for prediabetic Priya with HbA1c-anchored reason", () => {
    const v = verdictFor(biryani, priya as Persona);
    expect(v.forYou).toBe("watch");
    expect(v.oneLineReason).toMatch(/HbA1c/);
    expect(v.swap).toBeDefined();
  });
});
