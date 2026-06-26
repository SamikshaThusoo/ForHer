"use client";

export type MealType = "breakfast" | "lunch" | "dinner";
export const MEALS: MealType[] = ["breakfast", "lunch", "dinner"];

type Entry = { date: string; meal: MealType; foodId: string; foodName: string; at: string };
const KEY = "forher.foodlog.v1";
const pad = (n: number) => String(n).padStart(2, "0");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

function read(): Entry[] {
  try { const a = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}

/** Log (or replace) today's entry for a meal. */
export function logMeal(meal: MealType, foodId: string, foodName: string) {
  const arr = read().filter((e) => !(e.date === today() && e.meal === meal));
  arr.push({ date: today(), meal, foodId, foodName, at: new Date().toISOString() });
  try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch { /* ignore */ }
}

/** Map of today's logged meals -> the food name. */
export function todaysMeals(): Partial<Record<MealType, string>> {
  const out: Partial<Record<MealType, string>> = {};
  read().filter((e) => e.date === today()).forEach((e) => { out[e.meal] = e.foodName; });
  return out;
}
