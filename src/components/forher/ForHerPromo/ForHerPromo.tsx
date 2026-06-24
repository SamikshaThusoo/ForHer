"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import {
  entryFraming, personaTrack, resolveDailyPlan, pickThreeThings, getPhase, TRACK_LABELS,
} from "@/lib/journey";
import {
  Sparkles, ArrowRight, CalendarHeart, Activity, MessagesSquare, Moon,
} from "lucide-react";
import styles from "./ForHerPromo.module.css";

const PHASE_LABEL: Record<string, string> = { foundation: "Foundation", build: "Build", milestone: "Milestone" };

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
            <p className={styles.sub}>These can be linked to PMOS — take the 3-minute check.</p>
          </>
        ) : (
          <>
            <h3 className={styles.title}>{f.state === "C" ? "Understand your cycle & hormones" : "A quick check for your hormonal health"}</h3>
            <p className={styles.sub}>{f.state === "C" ? "A 3-minute PMOS check — no health report needed." : "See whether PMOS patterns apply to you."}</p>
          </>
        )}
        <span className={styles.cta}>Take the check <ArrowRight size={15} /></span>
      </Link>
    );
  }

  // ---- Assessed, no care plan: minimal companion card (don't overcrowd) ----
  if (track === "none") {
    return (
      <div className={`${styles.companion} fhReveal`}>
        <div className={styles.compHead}>
          <span className={styles.compBrand}>For Her · Companion</span>
          <Link href="/forher" className={styles.compOpen}>Open <ArrowRight size={13} /></Link>
        </div>
        <div className={styles.compTiles}>
          <Link href="/cycle" className={styles.compTile}><CalendarHeart size={18} /><span>Cycle</span></Link>
          <Link href="/hormones" className={styles.compTile}><Activity size={18} /><span>Hormones</span></Link>
          <Link href="/community" className={styles.compTile}><MessagesSquare size={18} /><span>Community</span></Link>
          <Link href="/log/mood" className={styles.compTile}><Moon size={18} /><span>Mood</span></Link>
        </div>
      </div>
    );
  }

  // ---- Assessed, on care plan: personalised view ----
  const three = pickThreeThings(resolveDailyPlan(persona, fh.day));
  const done = three.filter((t) => fh.isDone(t.id)).length;
  const phase = getPhase(fh.day);
  return (
    <Link href="/forher" className={`${styles.card} fhReveal`}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.head}>
        <span className={styles.brand}>For Her</span>
        <span className={styles.tag}>PMOS</span>
        <span className={styles.dayChip}>Day {fh.day}</span>
      </div>
      <p className={styles.eyebrow}>{TRACK_LABELS[track]} · {PHASE_LABEL[phase]}</p>
      <div className={styles.progressLine}>
        <span className={styles.progBig}>{done}/3</span>
        <span className={styles.progLabel}>things done today</span>
      </div>
      <div className={styles.miniTasks}>
        {three.map((t) => (
          <span key={t.id} className={`${styles.miniTask} ${fh.isDone(t.id) ? styles.miniDone : ""}`}>{t.title}</span>
        ))}
      </div>
      <span className={styles.cta}>Open today <ArrowRight size={15} /></span>
    </Link>
  );
}
