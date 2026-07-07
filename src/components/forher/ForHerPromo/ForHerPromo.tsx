"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { entryFraming, personaTrack } from "@/lib/journey";
import { activeNudge, readDismissed, dismissNudge, type NudgeType } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { ForHerHub } from "@/components/forher/ForHerHub/ForHerHub";
import { ForHerCompanionHub } from "@/components/forher/ForHerCompanionHub/ForHerCompanionHub";
import { ClinicNudge } from "@/components/forher/ClinicNudge/ClinicNudge";
import { Sparkles, ArrowRight, ScanLine, Stethoscope } from "lucide-react";
import styles from "./ForHerPromo.module.css";

/** The For Her card on the Habit Health home — the hub. Three states:
 *  first-time entry (-> assessment), personalised care-plan view, or a minimal
 *  companion card. */
export function ForHerPromo() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const [justDismissed, setJustDismissed] = useState<Set<NudgeType>>(new Set());
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

  // Phase 3 nudge — companion (none) + low only. activeNudge returns null for medium/high.
  const dismissed = new Set<NudgeType>([...readDismissed(persona.id), ...justDismissed]);
  const nudge = activeNudge({
    tier: track,
    persona,
    cycleLog: fh.cycleLog,
    dayLog: readDayLog(persona.id),
    cycleLength: cycleLengthFor(persona, fh.cycleLog?.cycleLength),
    today: new Date(),
    dismissed,
  });
  const banner = nudge ? (
    <ClinicNudge
      nudge={nudge}
      onDismiss={() => {
        dismissNudge(persona.id, nudge.type);
        setJustDismissed((prev) => new Set([...prev, nudge.type]));
      }}
    />
  ) : null;

  // ---- Assessed, no care plan: companion carousel (same treatment as the plan) ----
  if (track === "none") {
    return (
      <div className={`${styles.hubWrap} fhReveal`}>
        {banner}
        <div className={styles.hubHead}>
          <div className={styles.hubLeft}>
            <span className={styles.hubBrand}>For Her <span className={styles.hubTag}>Companion</span></span>
            <span className={styles.hubPlanMuted}>Tracking &amp; insights</span>
          </div>
          <Link href="/cares/scan" className={styles.hubScan}><ScanLine size={18} /><span>Scan</span></Link>
        </div>
        <ForHerCompanionHub />
      </div>
    );
  }

  // ---- Assessed, on care plan: the live carousel, right on the home ----
  return (
    <div className={`${styles.hubWrap} fhReveal`}>
      {banner}
      <div className={styles.hubHead}>
        <div className={styles.hubLeft}>
          <span className={styles.hubBrand}>For Her <span className={styles.hubTag}>PMOS</span></span>
          <Link href="/plan" className={styles.hubPlan}>Day {Math.min(fh.day, 90)} of 90 · See plan <ArrowRight size={12} /></Link>
        </div>
        <Link href="/cares/scan" className={styles.hubScan}><ScanLine size={18} /><span>Scan</span></Link>
      </div>
      {(track === "medium" || track === "high") && (
        <Link href="/clinic" className={styles.clinicEntry}>
          <span className={styles.clinicIcon}><Stethoscope size={18} /></span>
          <span className={styles.clinicText}>
            <span className={styles.clinicEyebrow}>Clinic ForHer</span>
            <strong className={styles.clinicTitle}>Your care circle &amp; next visit</strong>
          </span>
          <span className={styles.clinicCta}>Open <ArrowRight size={14} /></span>
        </Link>
      )}
      <ForHerHub />
    </div>
  );
}
