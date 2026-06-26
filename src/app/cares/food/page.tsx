"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePersona } from "@/context/PersonaContext";
import { FOODS } from "@/data/foods";
import { verdictFor } from "@/lib/personalize";
import { logMeal, type MealType } from "@/lib/forher/foodlog";
import { ModeTabs } from "@/components/cares/FoodLogger/ModeTabs/ModeTabs";
import { PhotoMode } from "@/components/cares/FoodLogger/PhotoMode/PhotoMode";
import { ManualMode } from "@/components/cares/FoodLogger/ManualMode/ManualMode";
import { VoiceMode } from "@/components/cares/FoodLogger/VoiceMode/VoiceMode";
import { VerdictCard } from "@/components/cares/FoodLogger/VerdictCard/VerdictCard";
import { Check } from "lucide-react";
import styles from "./food.module.css";
import type { LogMode } from "@/types/food";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function FoodLogPage() {
  const { persona } = usePersona();
  const router = useRouter();
  const [mode, setMode] = useState<LogMode>("photo");
  const [lastFoodId, setLastFoodId] = useState<string | null>(null);
  const [meal, setMeal] = useState<MealType>("breakfast");

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("meal");
    if (m === "lunch" || m === "dinner" || m === "breakfast") setMeal(m);
  }, []);

  const lastFood = lastFoodId ? FOODS.find((f) => f.id === lastFoodId) : null;
  const verdict = lastFood ? verdictFor(lastFood, persona) : null;

  return (
    <main className={styles.main}>
      <h2 className={styles.title}>Log {cap(meal)}</h2>
      <p className={styles.sub}>4 ways to log. Pick what&apos;s fastest right now.</p>
      <ModeTabs value={mode} onChange={setMode} />
      <div className={styles.modeBody}>
        {(mode === "photo" || mode === "barcode") && (
          <PhotoMode onLog={(id) => setLastFoodId(id)} />
        )}
        {mode === "voice" && <VoiceMode onLog={(id) => setLastFoodId(id)} />}
        {mode === "manual" && <ManualMode onLog={(id) => setLastFoodId(id)} />}
      </div>
      {lastFood && verdict && (
        <>
          <VerdictCard verdict={verdict} foodName={lastFood.name} />
          <button type="button" className={styles.logCta}
            onClick={() => { logMeal(meal, lastFood.id, lastFood.name); router.push("/"); }}>
            <Check size={16} /> Log {meal} · {lastFood.name}
          </button>
        </>
      )}
    </main>
  );
}
