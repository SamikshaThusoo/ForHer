"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { entryFraming } from "@/lib/journey";
import { Sparkles, ArrowRight } from "lucide-react";
import styles from "./ForHerPromo.module.css";

/** The For Her entry point on the Habit Health home (shown where the activity
 *  tracker was). Opens the For Her section. */
export function ForHerPromo() {
  const { persona } = usePersona();
  const f = entryFraming(persona);
  if (!f) return null;

  return (
    <Link href="/forher" className={styles.card}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.head}>
        <span className={styles.brand}>For Her</span>
        <span className={styles.tag}>PMOS</span>
        <span className={styles.spark}><Sparkles size={13} /></span>
      </div>

      {f.markers && f.markers.length > 0 ? (
        <>
          <p className={styles.eyebrow}>Flagged in your health check</p>
          <div className={styles.markers}>
            {f.markers.map((m) => (
              <span key={m.label} className={styles.marker}><strong>{m.value}</strong> {m.label}</span>
            ))}
          </div>
          <p className={styles.sub}>These can be linked to PMOS — let&apos;s take a closer look.</p>
        </>
      ) : (
        <>
          <h3 className={styles.title}>Your cycle &amp; hormones, handled with care</h3>
          <p className={styles.sub}>A PMOS check, then a plan that fits your everyday.</p>
        </>
      )}

      <span className={styles.cta}>Open For Her <ArrowRight size={15} /></span>
    </Link>
  );
}
