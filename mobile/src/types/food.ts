import type { Status } from "./persona";

export type LogMode = "photo" | "write" | "voice" | "manual";

export interface FoodItem {
  id: string;
  name: string;
  category: "indian-meal" | "packaged" | "beverage" | "snack" | "fruit";
  imageHint?: string;             // emoji for prototype
  per100g: {
    energyKcal: number;
    carbsG: number;
    sugarG: number;
    proteinG: number;
    fatG: number;
    fiberG: number;
    sodiumMg: number;
  };
  diseaseTags: {
    diabetes: Status;
    hypertension: Status;
    cvd: Status;
    pcos: Status;
  };
}

export interface Verdict {
  forYou: "great" | "ok" | "watch" | "avoid";
  oneLineReason: string;          // anchored to the user's labs
  swap?: { name: string; reason: string };
  detail: string;                 // longer prose
}

export interface FoodLogEntry {
  id: string;
  mode: LogMode;
  itemId: string;
  loggedAt: string;
}
