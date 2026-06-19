import type { FoodItem } from "@/types/food";

export const FOODS: FoodItem[] = [
  {
    id: "f-biryani", name: "Chicken Biryani", category: "indian-meal", imageHint: "🍚",
    per100g: { energyKcal: 290, carbsG: 38, sugarG: 1, proteinG: 12, fatG: 10, fiberG: 1, sodiumMg: 550 },
    diseaseTags: { diabetes: "flagged", hypertension: "borderline", cvd: "borderline", pcos: "borderline" },
  },
  {
    id: "f-roti-dal", name: "2 Rotis + Dal + Salad", category: "indian-meal", imageHint: "🥗",
    per100g: { energyKcal: 180, carbsG: 24, sugarG: 1, proteinG: 9, fatG: 4, fiberG: 5, sodiumMg: 220 },
    diseaseTags: { diabetes: "normal", hypertension: "normal", cvd: "normal", pcos: "normal" },
  },
  {
    id: "f-paneer-tikka", name: "Paneer Tikka", category: "indian-meal", imageHint: "🍢",
    per100g: { energyKcal: 230, carbsG: 6, sugarG: 2, proteinG: 14, fatG: 17, fiberG: 1, sodiumMg: 380 },
    diseaseTags: { diabetes: "normal", hypertension: "borderline", cvd: "borderline", pcos: "normal" },
  },
  {
    id: "f-banana", name: "Banana", category: "fruit", imageHint: "🍌",
    per100g: { energyKcal: 89, carbsG: 23, sugarG: 12, proteinG: 1, fatG: 0, fiberG: 3, sodiumMg: 1 },
    diseaseTags: { diabetes: "borderline", hypertension: "normal", cvd: "normal", pcos: "normal" },
  },
  {
    id: "f-pani-puri", name: "Pani Puri", category: "snack", imageHint: "🥟",
    per100g: { energyKcal: 320, carbsG: 48, sugarG: 4, proteinG: 6, fatG: 12, fiberG: 2, sodiumMg: 740 },
    diseaseTags: { diabetes: "flagged", hypertension: "flagged", cvd: "borderline", pcos: "borderline" },
  },
];
