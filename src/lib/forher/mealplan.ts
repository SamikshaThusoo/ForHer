import type { Persona } from "@/types/persona";
import type { MealType } from "./foodlog";
import { personaTrack } from "@/lib/journey";
import { TOUCHPOINT_SCHEDULE } from "@/lib/journey/constants";

export type PrescribedOption = { name: string; note: string };

// Seeded to read like the dietician's plan: low-GI, PCOS-appropriate named foods
// each with a short supportive qualitative note. No numbers, calories, macros or
// targets anywhere. The app DISPLAYS this plan; it does not generate diet advice —
// production replaces this with the dietician's real prescribed plan.
export const MEAL_PLAN: Record<MealType, PrescribedOption[]> = {
  breakfast: [
    { name: "Vegetable poha with peanuts", note: "Steady-energy start" },
    { name: "Besan chilla with mint chutney", note: "Protein-led, keeps you full" },
    { name: "Vegetable oats upma", note: "Slow-release fibre" },
  ],
  lunch: [
    { name: "Rajma with a small bowl of brown rice", note: "Fibre and protein, balanced" },
    { name: "Roti with palak paneer", note: "Iron and protein" },
    { name: "Millet khichdi with vegetables", note: "Low-GI, easy on digestion" },
  ],
  dinner: [
    { name: "Grilled paneer with sautéed vegetables", note: "Light, protein-rich evening" },
    { name: "Moong dal with two rotis", note: "Gentle, steady overnight" },
    { name: "Tofu and vegetable stir-fry", note: "Warm and easy to digest" },
  ],
};

export function prescribedFor(meal: MealType): PrescribedOption[] {
  return MEAL_PLAN[meal] ?? [];
}

/** The care-plan day the persona's dietician (nutritionist) intake falls on — the
 *  day her plan is prescribed. Returns null for tracks with no nutritionist
 *  (low / none), which never unlock the plan. Read-only over the touchpoint schedule. */
export function nutritionistIntakeDay(persona: Persona): number | null {
  const track = personaTrack(persona);
  const days = TOUCHPOINT_SCHEDULE
    .filter((r) => r.services.includes("nutritionist") && r.tracks.includes(track))
    .map((r) => r.day)
    .sort((a, b) => a - b);
  return days.length ? days[0] : null;
}

/** The dietician's meal plan unlocks once the nutritionist intake day has passed. */
export function mealPlanUnlocked(persona: Persona, day: number): boolean {
  const d = nutritionistIntakeDay(persona);
  return d != null && day >= d;
}
