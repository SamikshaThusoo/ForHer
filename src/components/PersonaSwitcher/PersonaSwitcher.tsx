"use client";
import { usePersona } from "@/context/PersonaContext";
import styles from "./PersonaSwitcher.module.css";

export function PersonaSwitcher() {
  const { persona, setPersonaId, allPersonas } = usePersona();
  return (
    <div className={styles.switcher} role="group" aria-label="Demo persona">
      {allPersonas.map((p) => (
        <button
          key={p.id}
          className={p.id === persona.id ? styles.active : styles.option}
          onClick={() => setPersonaId(p.id)}
          aria-pressed={p.id === persona.id}
        >
          <span className={styles.name}>{p.shortName}</span>
          <span className={styles.meta}>{p.cares.enrolled ? "Cares · State B" : "State A"}</span>
        </button>
      ))}
    </div>
  );
}
