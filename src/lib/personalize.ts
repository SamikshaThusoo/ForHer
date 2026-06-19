import type { FoodItem, Verdict } from "@/types/food";
import type { Persona } from "@/types/persona";

const SEVERITY = { normal: 0, borderline: 1, flagged: 2, severe: 3 } as const;

export function verdictFor(food: FoodItem, persona: Persona): Verdict {
  const { labs } = persona.smartReport;
  const hba1c = labs.find((l) => l.key === "hba1c");
  const sbp   = labs.find((l) => l.key === "sbp");

  const diabSev = SEVERITY[food.diseaseTags.diabetes];
  const htnSev  = SEVERITY[food.diseaseTags.hypertension];

  const worst = Math.max(diabSev, htnSev);
  let forYou: Verdict["forYou"] = "great";
  if (worst === 1) forYou = "ok";
  if (worst === 2) forYou = "watch";
  if (worst === 3) forYou = "avoid";

  const reasons: string[] = [];
  if (hba1c && diabSev >= 2) {
    reasons.push(`This will spike your glucose — your HbA1c is ${hba1c.value}%`);
  }
  if (sbp && htnSev >= 2) {
    reasons.push(`High sodium for your BP (${sbp.value} mmHg)`);
  }
  const oneLineReason = reasons[0] ?? `Fits well with your current plan`;

  const swap = forYou === "watch" || forYou === "avoid"
    ? { name: "Half portion + cucumber raita + 15-min walk after", reason: "blunts the glucose spike" }
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
  const macroLine = `${macros.energyKcal} kcal · ${macros.carbsG}g carbs · ${macros.proteinG}g protein · ${macros.sodiumMg}mg sodium per 100g`;
  if (reasons.length === 0) return `${macroLine}. Fits your plan today.`;
  return `${macroLine}. ${reasons.join(". ")}.`;
}
