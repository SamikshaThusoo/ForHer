"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Sprout } from "lucide-react";
import { logPrescribed, onPlanMealsThisWeek, type MealType } from "@/lib/forher/foodlog";
import { prescribedFor } from "@/lib/forher/mealplan";
import styles from "./PrescribedPlan.module.css";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The dietician's prescribed options for this meal — the guided primary path.
 *  Tap one to log it on-plan. Seeded to read as the dietician's plan; the app
 *  displays it and does not generate diet advice. No numbers, calories or targets. */
export function PrescribedPlan({ meal }: { meal: MealType }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const options = prescribedFor(meal);
  const [weekCount, setWeekCount] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => { setWeekCount(onPlanMealsThisWeek()); }, []);

  const pick = (name: string) => {
    if (picked) return;
    setPicked(name);
    logPrescribed(meal, name);
    window.setTimeout(() => router.push("/"), 620);
  };

  return (
    <section className={styles.wrap} aria-label="Your dietician's plan">
      <div className={styles.head}>
        <span className={styles.eyebrow}>From your dietician&apos;s plan</span>
        <h3 className={styles.title}>Options for {cap(meal)}</h3>
      </div>
      <ul className={styles.list}>
        {options.map((o) => {
          const on = picked === o.name;
          return (
            <li key={o.name}>
              <motion.button
                type="button"
                className={`${styles.card} ${on ? styles.cardOn : ""}`}
                onClick={() => pick(o.name)}
                disabled={!!picked}
                whileTap={reduce || picked ? undefined : { scale: 0.98 }}
              >
                <span className={styles.cardMain}>
                  <span className={styles.name}>{o.name}</span>
                  <span className={styles.note}>{o.note}</span>
                </span>
                <span className={styles.pick} aria-hidden>
                  {on ? <Check size={17} strokeWidth={3} /> : <span className={styles.dot} />}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
      {weekCount > 0 && (
        <p className={styles.soft}>
          <Sprout size={13} /> {weekCount} plan meal{weekCount > 1 ? "s" : ""} logged this week
        </p>
      )}
    </section>
  );
}
