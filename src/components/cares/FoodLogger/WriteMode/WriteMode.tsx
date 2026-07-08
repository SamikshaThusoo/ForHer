"use client";
import { useState } from "react";
import { MealField } from "../MealField/MealField";
import type { MealType } from "@/lib/forher/foodlog";

/** Type a meal and save. Thin wrapper over the shared MealField (the one save surface). */
export function WriteMode({ meal }: { meal: MealType }) {
  const [text, setText] = useState("");
  return (
    <MealField
      meal={meal}
      method="typed"
      value={text}
      onChange={setText}
      placeholder="Type what you ate — e.g. two rotis, dal and a bowl of curd"
    />
  );
}
