"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { entryFraming } from "@/lib/journey";
import { Sparkles, ArrowRight } from "lucide-react";
import styles from "./ForHerEntryCard.module.css";

export function ForHerEntryCard() {
  const { persona } = usePersona();
  const f = entryFraming(persona);
  if (!f) return null;
  return (
    <section className={`${styles.card} ${styles[f.urgency]}`}>
      <span className={styles.eyebrow}><Sparkles size={13} /> {f.eyebrow}</span>
      <h3 className={styles.headline}>{f.headline}</h3>
      {f.markers && f.markers.length > 0 && (
        <div className={styles.markers}>
          {f.markers.map((m) => (
            <span key={m.label} className={styles.marker}>
              <strong>{m.value}</strong> {m.label}
            </span>
          ))}
        </div>
      )}
      <p className={styles.sub}>{f.sub}</p>
      <Link href="/for-her" className={styles.cta}>{f.cta} <ArrowRight size={16} /></Link>
    </section>
  );
}
