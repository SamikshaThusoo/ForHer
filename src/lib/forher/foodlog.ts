"use client";

export type MealType = "breakfast" | "lunch" | "dinner";
export const MEALS: MealType[] = ["breakfast", "lunch", "dinner"];

/** How the meal was captured. Catalog picks (photo/search) carry a foodId;
 *  free-text (typed/voice) carry `text` and no foodId. */
export type LogMethod = "photo" | "search" | "typed" | "voice";

// `foodId` is optional so free-text entries (typed / voice) can be logged without a
// catalog item. Older entries always have foodId+foodName and still parse unchanged.
type Entry = { date: string; meal: MealType; foodId?: string; foodName: string; at: string; method?: LogMethod; text?: string };
const KEY = "forher.foodlog.v1";
const pad = (n: number) => String(n).padStart(2, "0");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

function read(): Entry[] {
  try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}

/** Log (or replace) today's entry for a meal from a catalog food. */
export function logMeal(meal: MealType, foodId: string, foodName: string, method: LogMethod = "search") {
  const arr = read().filter((e) => !(e.date === today() && e.meal === meal));
  arr.push({ date: today(), meal, foodId, foodName, at: new Date().toISOString(), method });
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch { /* ignore */ }
}

/** Log (or replace) today's entry for a meal from free text (typed or voice).
 *  Stored as the display name too, so it shows on the hub like any other meal. */
export function logText(meal: MealType, text: string, method: "typed" | "voice") {
  const clean = text.trim();
  if (!clean) return;
  const arr = read().filter((e) => !(e.date === today() && e.meal === meal));
  arr.push({ date: today(), meal, foodName: clean, text: clean, method, at: new Date().toISOString() });
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch { /* ignore */ }
}

/** Map of today's logged meals -> the food name. */
export function todaysMeals(): Partial<Record<MealType, string>> {
  const out: Partial<Record<MealType, string>> = {};
  read().filter((e) => e.date === today()).forEach((e) => { out[e.meal] = e.foodName; });
  return out;
}
