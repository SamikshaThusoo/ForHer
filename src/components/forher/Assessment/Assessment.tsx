"use client";
import { useState } from "react";
import type { AssessmentAnswers } from "@/types/journey";
import { Info, ArrowRight } from "lucide-react";
import styles from "./Assessment.module.css";

const QUESTIONS: { key: keyof AssessmentAnswers; domain: string; q: string; yes: string; no: string }[] = [
  { key: "irregularPeriods", domain: "Your cycle", q: "How predictable is your period?", yes: "All over the place", no: "Fairly regular" },
  { key: "acneSkin", domain: "Skin", q: "Acne or oily skin that won't settle — especially around the jaw?", yes: "Yes, persistent", no: "Rarely" },
  { key: "hairChanges", domain: "Hair", q: "Noticed unwanted facial or body hair, or thinning at the scalp?", yes: "Yes, noticed it", no: "No changes" },
  { key: "weightDifficulty", domain: "Energy & weight", q: "Does weight cling on, even when you eat well and move?", yes: "Yes, it clings on", no: "Feels manageable" },
  { key: "familyHistory", domain: "Family", q: "Diabetes or PMOS (PCOS) anywhere in your family?", yes: "Yes", no: "No / not sure" },
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
      <h2 className={styles.title}>A few quick questions</h2>
      <p className={styles.lead}>No right answers and no diagnosis — just tell us how things have felt lately. Takes about 2 minutes.</p>

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
                >{item.yes}</button>
                <button
                  type="button"
                  className={`${styles.pill} ${!answers[item.key] ? styles.no : ""}`}
                  onClick={() => set(item.key, false)}
                >{item.no}</button>
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
