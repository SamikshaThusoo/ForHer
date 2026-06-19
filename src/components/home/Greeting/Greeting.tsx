"use client";
import { usePersona } from "@/context/PersonaContext";
import styles from "./Greeting.module.css";

/**
 * "Hi <Name>" greeting with an optional sub-line for Cares-enrolled users
 * showing their program + week.
 */
export function Greeting() {
  const { persona } = usePersona();
  const fullName = `${persona.shortName}${persona.lastName ? ` ${persona.lastName}` : ""}`;

  // Compose sub-line. Only shown for Cares-enrolled personas.
  const enrolled = persona.cares.enrolled;
  const week = persona.cares.weekOfTwelve ?? 1;
  // Crude program name lookup — extend to a real registry later.
  const programLabel =
    persona.cares.primaryProgram === "prediabetes-reversal"
      ? "Prediabetes Reversal"
      : persona.cares.primaryProgram === "pcos-care"
      ? "PCOS Care"
      : persona.cares.primaryProgram === "cvd-risk-reduction"
      ? "CVD Risk Reduction"
      : persona.cares.primaryProgram === "hypertension-control"
      ? "Hypertension Control"
      : persona.cares.primaryProgram === "calorie-fit"
      ? "Calorie Fit"
      : "your";

  return (
    <div className={styles.greet}>
      <div className={styles.hi}>
        Hi <b>{fullName}</b>
      </div>
      {enrolled && (
        <div className={styles.sub}>
          Week {week} of your {programLabel} plan
        </div>
      )}
    </div>
  );
}
