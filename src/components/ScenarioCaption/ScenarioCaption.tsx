"use client";
import { usePersona } from "@/context/PersonaContext";
import { personaScenario } from "@/lib/journey";
import styles from "./ScenarioCaption.module.css";

/** Demo chrome: always-visible line naming the active persona's scenario/state,
 *  so a reviewer knows which user-state they're looking at on any screen. */
export function ScenarioCaption() {
  const { persona } = usePersona();
  const scenario = personaScenario(persona);
  return (
    <div className={styles.caption}>
      <span className={styles.who}>{persona.shortName}</span>
      <span className={styles.sep}>·</span>
      <span className={styles.what}>{scenario.full}</span>
    </div>
  );
}
