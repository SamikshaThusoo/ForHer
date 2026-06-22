"use client";
import { useState } from "react";
import { usePersona } from "@/context/PersonaContext";
import { FOODS } from "@/data/foods";
import { verdictFor } from "@/lib/personalize";
import { ModeTabs } from "@/components/cares/FoodLogger/ModeTabs/ModeTabs";
import { PhotoMode } from "@/components/cares/FoodLogger/PhotoMode/PhotoMode";
import { ManualMode } from "@/components/cares/FoodLogger/ManualMode/ManualMode";
import { VerdictCard } from "@/components/cares/FoodLogger/VerdictCard/VerdictCard";
import styles from "./food.module.css";
import type { LogMode } from "@/types/food";

export default function FoodLogPage() {
  const { persona } = usePersona();
  const [mode, setMode] = useState<LogMode>("photo");
  const [lastFoodId, setLastFoodId] = useState<string | null>(null);

  const lastFood = lastFoodId ? FOODS.find((f) => f.id === lastFoodId) : null;
  const verdict = lastFood ? verdictFor(lastFood, persona) : null;

  return (
    <main className={styles.main}>
      <h2 className={styles.title}>Log food</h2>
      <p className={styles.sub}>4 ways to log. Pick what's fastest right now.</p>
      <ModeTabs value={mode} onChange={setMode} />
      <div className={styles.modeBody}>
        {(mode === "photo" || mode === "barcode" || mode === "voice") && (
          <PhotoMode onLog={(id) => setLastFoodId(id)} />
        )}
        {mode === "manual" && <ManualMode onLog={(id) => setLastFoodId(id)} />}
      </div>
      {lastFood && verdict && <VerdictCard verdict={verdict} foodName={lastFood.name} />}
    </main>
  );
}
