import type { FoodItem, Verdict } from "@/types/food";
import type { Persona } from "@/types/persona";

const SEVERITY = { normal: 0, borderline: 1, flagged: 2, severe: 3 } as const;

// PCOS/PMOS-centric verdict: insulin sensitivity is the lens. We weigh the food's
// PCOS tag together with its sugar / refined-carb / protein+fibre profile, and frame
// reasons around steady blood sugar (never guilt). HbA1c adds context when present.
export function verdictFor(food: FoodItem, persona: Persona): Verdict {
  const { labs } = persona.smartReport;
  const hba1c = labs.find((l) => l.key === "hba1c");

  const pcosSev = SEVERITY[food.diseaseTags.pcos];
  const { sugarG, carbsG, fiberG, proteinG } = food.per100g;

  // Start from the PCOS tag, then nudge by the macro profile.
  let score: number = pcosSev;
  if (sugarG >= 15) score = Math.max(score, 3);
  else if (sugarG >= 8) score = Math.max(score, 2);
  if (carbsG >= 40 && fiberG < 3) score = Math.max(score, 2); // fast refined carbs
  if (proteinG >= 8 && fiberG >= 4 && sugarG < 8) score = Math.min(score, 1); // steadying combo

  let forYou: Verdict["forYou"] = "great";
  if (score === 1) forYou = "ok";
  if (score === 2) forYou = "watch";
  if (score >= 3) forYou = "avoid";

  const reasons: string[] = [];
  if (sugarG >= 15) {
    reasons.push("High in sugar — quick spikes hit insulin harder with PMOS");
  } else if (carbsG >= 40 && fiberG < 3) {
    reasons.push("Refined carbs digest fast — pair with protein or fibre to steady blood sugar");
  }
  if (proteinG >= 8 && fiberG >= 4) {
    reasons.push("Good protein and fibre — keeps blood sugar steady, which helps with PMOS");
  }
  if (hba1c && score >= 2) {
    reasons.push(`Worth easing up — your HbA1c is ${hba1c.value}%`);
  }
  const oneLineReason = reasons[0] ?? "A balanced choice for steady blood sugar";

  const swap = forYou === "watch" || forYou === "avoid"
    ? { name: "Add protein + fibre (paneer / dal / a handful of nuts) and a 10-min walk after", reason: "blunts the blood-sugar spike" }
    : undefined;

  return {
    forYou,
    oneLineReason,
    swap,
    detail: buildDetail(food, persona, reasons),
  };
}

function buildDetail(food: FoodItem, persona: Persona, reasons: string[]): string {
  const macros = food.per100g;
  const macroLine = `${macros.energyKcal} kcal · ${macros.carbsG}g carbs · ${macros.sugarG}g sugar · ${macros.proteinG}g protein · ${macros.fiberG}g fibre per 100g`;
  if (reasons.length === 0) return `${macroLine}. Fits your plan today.`;
  return `${macroLine}. ${reasons.join(". ")}.`;
}
