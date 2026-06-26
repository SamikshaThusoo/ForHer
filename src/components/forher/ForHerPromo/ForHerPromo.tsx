"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { entryFraming, personaTrack, TRACK_LABELS } from "@/lib/journey";
import { ForHerHub } from "@/components/forher/ForHerHub/ForHerHub";
import { ForHerCompanionHub } from "@/components/forher/ForHerCompanionHub/ForHerCompanionHub";
import { Sparkles, ArrowRight } from "lucide-react";
import styles from "./ForHerPromo.module.css";

/** The For Her card on the Habit Health home — the hub. Three states:
 *  first-time entry (-> assessment), personalised care-plan view, or a minimal
 *  companion card. */
export function ForHerPromo() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const f = entryFraming(persona);
  if (!f) return null; // not eligible
  const track = personaTrack(persona);

  // ---- First-time (or pre-hydration): entry card → assessment directly ----
  if (!fh.hydrated || !fh.assessed) {
    return (
      <Link href="/for-her" className={`${styles.card} fhReveal`}>
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
              {f.markers.map((m) => <span key={m.label} className={styles.marker}><strong>{m.value}</strong> {m.label}</span>)}
            </div>
            <p className={styles.sub}>These can be linked to PMOS — take the 2-minute check.</p>
          </>
        ) : (
          <>
            <h3 className={styles.title}>{f.state === "C" ? "Understand your cycle & hormones" : "A quick check for your hormonal health"}</h3>
            <p className={styles.sub}>{f.state === "C" ? "A 2-minute PMOS check — no health report needed." : "See whether PMOS patterns apply to you."}</p>
          </>
        )}
        <span className={styles.cta}>Take the check <ArrowRight size={15} /></span>
      </Link>
    );
  }

  // ---- Assessed, no care plan: companion carousel (same treatment as the plan) ----
  if (track === "none") {
    return (
      <div className={`${styles.hubWrap} fhReveal`}>
        <div className={styles.hubHead}>
          <span className={styles.hubBrand}>For Her <span className={styles.hubTag}>Companion</span></span>
        </div>
        <p className={styles.hubDay}>Tracking &amp; insights · no daily plan needed right now</p>
        <ForHerCompanionHub />
      </div>
    );
  }

  // ---- Assessed, on care plan: the live carousel, right on the home ----
  return (
    <div className={`${styles.hubWrap} fhReveal`}>
      <div className={styles.hubHead}>
        <span className={styles.hubBrand}>For Her <span className={styles.hubTag}>PMOS</span></span>
        <Link href="/plan" className={styles.hubOpen}>See my 90-day plan <ArrowRight size={13} /></Link>
      </div>
      <p className={styles.hubDay}>{TRACK_LABELS[track]} · Day {fh.day}</p>
      <ForHerHub />
    </div>
  );
}
