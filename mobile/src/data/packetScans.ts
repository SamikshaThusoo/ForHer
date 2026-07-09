import type { FoodItem } from "@/types/food";

export interface PacketScan extends FoodItem {
  barcode: string;
  brand: string;
  altSuggestion?: { brand: string; name: string; whyBetter: string };
}

export const PACKET_SCANS: PacketScan[] = [
  {
    id: "p-britannia-digestive", barcode: "8901063012345",
    brand: "Britannia", name: "Digestive (1 biscuit ≈ 12g)", category: "packaged", imageHint: "🍪",
    per100g: { energyKcal: 460, carbsG: 65, sugarG: 18, proteinG: 8, fatG: 18, fiberG: 4, sodiumMg: 460 },
    diseaseTags: { diabetes: "borderline", hypertension: "borderline", cvd: "borderline", pcos: "borderline" },
    altSuggestion: { brand: "Britannia", name: "Marie Lite", whyBetter: "30% less sodium, slower glucose curve" },
  },
  {
    id: "p-maggi", barcode: "8901058855432",
    brand: "Nestlé", name: "Maggi 2-Min Masala (per pack)", category: "packaged", imageHint: "🍜",
    per100g: { energyKcal: 440, carbsG: 60, sugarG: 4, proteinG: 9, fatG: 17, fiberG: 3, sodiumMg: 1480 },
    diseaseTags: { diabetes: "flagged", hypertension: "severe", cvd: "flagged", pcos: "borderline" },
    altSuggestion: { brand: "Tata Soulfull", name: "Millet Noodles", whyBetter: "60% less sodium, fibre-rich, slower spike" },
  },
  {
    id: "p-amul-curd", barcode: "8901262100123",
    brand: "Amul", name: "Plain Dahi (Curd)", category: "packaged", imageHint: "🥛",
    per100g: { energyKcal: 60, carbsG: 4, sugarG: 4, proteinG: 3, fatG: 3.5, fiberG: 0, sodiumMg: 50 },
    diseaseTags: { diabetes: "normal", hypertension: "normal", cvd: "normal", pcos: "normal" },
  },
  {
    id: "p-lays", barcode: "8901491102567",
    brand: "Lay's", name: "Magic Masala Chips", category: "packaged", imageHint: "🍟",
    per100g: { energyKcal: 536, carbsG: 56, sugarG: 2, proteinG: 6, fatG: 33, fiberG: 4, sodiumMg: 820 },
    diseaseTags: { diabetes: "flagged", hypertension: "flagged", cvd: "flagged", pcos: "borderline" },
    altSuggestion: { brand: "Too Yumm", name: "Baked Multigrain", whyBetter: "Baked not fried, lower sodium" },
  },
];
