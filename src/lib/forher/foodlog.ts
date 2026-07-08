"use client";

export type MealType = "breakfast" | "lunch" | "dinner";
export const MEALS: MealType[] = ["breakfast", "lunch", "dinner"];

/** How the meal was captured. Catalog picks (photo/search) carry a foodId;
 *  free-text (typed/voice) carry `text` and no foodId; `prescribed` is a tap on the
 *  dietician's plan (on-plan). */
export type LogMethod = "photo" | "search" | "typed" | "voice" | "prescribed";

// `foodId` is optional so free-text/prescribed entries can be logged without a catalog
// item. `onPlan` is a soft, neutral flag (a prescribed pick is on-plan; everything else
// is off-plan) — never a score. Older entries lack these fields and still parse unchanged.
type Entry = { date: string; meal: MealType; foodId?: string; foodName: string; at: string; method?: LogMethod; text?: string; onPlan?: boolean };
const KEY = "forher.foodlog.v1";
const pad = (n: number) => String(n).padStart(2, "0");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

function read(): Entry[] {
  try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}

function save(arr: Entry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch { /* ignore */ }
}
const withoutTodays = (meal: MealType) => read().filter((e) => !(e.date === today() && e.meal === meal));

/** Log (or replace) today's entry for a meal from a catalog food (off-plan / neutral). */
export function logMeal(meal: MealType, foodId: string, foodName: string, method: LogMethod = "search") {
  const arr = withoutTodays(meal);
  arr.push({ date: today(), meal, foodId, foodName, at: new Date().toISOString(), method, onPlan: false });
  save(arr);
}

/** Log (or replace) today's entry from free text (typed or voice) — the off-plan
 *  "something else" fallback. Recorded neutrally; off-plan is not a failure. */
export function logText(meal: MealType, text: string, method: "typed" | "voice") {
  const clean = text.trim();
  if (!clean) return;
  const arr = withoutTodays(meal);
  arr.push({ date: today(), meal, foodName: clean, text: clean, method, at: new Date().toISOString(), onPlan: false });
  save(arr);
}

/** Log (or replace) today's entry from the dietician's prescribed plan (on-plan). */
export function logPrescribed(meal: MealType, foodName: string) {
  const arr = withoutTodays(meal);
  arr.push({ date: today(), meal, foodName, at: new Date().toISOString(), method: "prescribed", onPlan: true });
  save(arr);
}

/** A soft, neutral count of on-plan meals logged in the last 7 days — a gentle
 *  signal for daily activity / progress, never a score or percentage. */
export function onPlanMealsThisWeek(): number {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 6);
  const from = `${cutoff.getFullYear()}-${pad(cutoff.getMonth() + 1)}-${pad(cutoff.getDate())}`;
  return read().filter((e) => e.onPlan === true && e.date >= from).length;
}

/** Map of today's logged meals -> the food name. */
export function todaysMeals(): Partial<Record<MealType, string>> {
  const out: Partial<Record<MealType, string>> = {};
  read().filter((e) => e.date === today()).forEach((e) => { out[e.meal] = e.foodName; });
  return out;
}
