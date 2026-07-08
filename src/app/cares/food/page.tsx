"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { FOODS } from "@/data/foods";
import { verdictFor } from "@/lib/personalize";
import { logMeal, type MealType } from "@/lib/forher/foodlog";
import { mealPlanUnlocked } from "@/lib/forher/mealplan";
import { ModeTabs } from "@/components/cares/FoodLogger/ModeTabs/ModeTabs";
import { PhotoMode } from "@/components/cares/FoodLogger/PhotoMode/PhotoMode";
import { ManualMode } from "@/components/cares/FoodLogger/ManualMode/ManualMode";
import { WriteMode } from "@/components/cares/FoodLogger/WriteMode/WriteMode";
import { VoiceMode } from "@/components/cares/FoodLogger/VoiceMode/VoiceMode";
import { VerdictCard } from "@/components/cares/FoodLogger/VerdictCard/VerdictCard";
import { PrescribedPlan } from "@/components/cares/FoodLogger/PrescribedPlan/PrescribedPlan";
import { Check, Lock, ChevronDown } from "lucide-react";
import styles from "./food.module.css";
import type { LogMode } from "@/types/food";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function FoodLogPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const router = useRouter();
  const [mode, setMode] = useState<LogMode>("photo");
  const [lastFoodId, setLastFoodId] = useState<string | null>(null);
  const [meal, setMeal] = useState<MealType>("breakfast");
  const [showElse, setShowElse] = useState(false);

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("meal");
    if (m === "lunch" || m === "dinner" || m === "breakfast") setMeal(m);
  }, []);

  const lastFood = lastFoodId ? FOODS.find((f) => f.id === lastFoodId) : null;
  const verdict = lastFood ? verdictFor(lastFood, persona) : null;
  const unlocked = mealPlanUnlocked(persona, fh.day);

  // The free-text / voice / catalog logger — the everyday path before the consult,
  // and the "something else" off-plan fallback after it.
  const logger = (
    <>
      <ModeTabs value={mode} onChange={setMode} />
      <div className={styles.modeBody}>
        {mode === "photo" && <PhotoMode onLog={(id) => setLastFoodId(id)} />}
        {mode === "write" && <WriteMode meal={meal} />}
        {mode === "voice" && <VoiceMode meal={meal} />}
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
    </>
  );

  return (
    <main className={styles.main}>
      <h2 className={styles.title}>Log {cap(meal)}</h2>

      {unlocked ? (
        <>
          <p className={styles.sub}>Pick from your dietician&apos;s plan — or log something else.</p>
          <PrescribedPlan meal={meal} />

          {/* Quiet, always-available off-plan fallback. */}
          <div className={styles.elseWrap}>
            <button
              type="button"
              className={styles.elseToggle}
              onClick={() => setShowElse((s) => !s)}
              aria-expanded={showElse}
            >
              <span>I ate something else</span>
              <ChevronDown size={16} className={showElse ? styles.chevOpen : styles.chev} />
            </button>
            {showElse && <div className={styles.elseBody}>{logger}</div>}
          </div>
        </>
      ) : (
        <>
          <p className={styles.sub}>4 ways to log. Pick what&apos;s fastest right now.</p>
          <div className={styles.unlockHint}>
            <Lock size={15} />
            <span>Your meal plan unlocks after your dietician consult.</span>
          </div>
          {logger}
        </>
      )}
    </main>
  );
}
