"use client";
import { useState } from "react";
import type { AssessmentAnswers } from "@/types/journey";
import { Info, ArrowRight } from "lucide-react";
import styles from "./Assessment.module.css";

const QUESTIONS: { key: keyof AssessmentAnswers; domain: string; q: string }[] = [
  { key: "irregularPeriods", domain: "Cycle", q: "Are your periods irregular or unpredictable?" },
  { key: "acneSkin", domain: "Skin", q: "Do you get persistent acne or oily skin?" },
  { key: "hairChanges", domain: "Skin", q: "Noticed extra facial/body hair, or scalp thinning?" },
  { key: "weightDifficulty", domain: "Metabolic", q: "Do you find it hard to manage your weight?" },
  { key: "familyHistory", domain: "Family", q: "Family history of diabetes or PMOS (PCOS)?" },
];

export function Assessment({
  initial, hasAhc, entryState, onComplete,
}: {
  initial: AssessmentAnswers;
  hasAhc: boolean;
  entryState: "A" | "B" | "C" | "D";
  onComplete: (a: AssessmentAnswers) => void;
}) {
  const [answers, setAnswers] = useState<AssessmentAnswers>(initial);
  const set = (k: keyof AssessmentAnswers, v: boolean) =>
    setAnswers((p) => ({ ...p, [k]: v }));

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>A quick 3-minute check</h2>
      <p className={styles.lead}>This is a screen, not a diagnosis — your answers help us understand your patterns.</p>

      {entryState === "C" && (
        <div className={styles.caveat}>
          <Info size={15} />
          <span>No lab report on file — we&apos;ll screen on your answers and suggest labs to confirm the metabolic picture.</span>
        </div>
      )}

      <div className={styles.questions}>
        {QUESTIONS.map((item) => {
          const prefilled = entryState === "A" && hasAhc && item.key === "weightDifficulty";
          return (
            <div key={item.key} className={styles.q}>
              <span className={styles.domain}>{item.domain}</span>
              <p className={styles.qtext}>{item.q}</p>
              {prefilled && <span className={styles.prefill}>From your health check</span>}
              <div className={styles.pills}>
                <button
                  type="button"
                  className={`${styles.pill} ${answers[item.key] ? styles.yes : ""}`}
                  onClick={() => set(item.key, true)}
                >Yes</button>
                <button
                  type="button"
                  className={`${styles.pill} ${!answers[item.key] ? styles.no : ""}`}
                  onClick={() => set(item.key, false)}
                >No</button>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" className={styles.cta} onClick={() => onComplete(answers)}>
        See my result <ArrowRight size={16} />
      </button>
    </div>
  );
}
