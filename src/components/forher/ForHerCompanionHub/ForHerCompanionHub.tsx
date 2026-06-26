"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import type { CyclePhase } from "@/types/journey";
import { FocusCarousel } from "../FocusCarousel/FocusCarousel";
import {
  Moon, ArrowRight, CalendarHeart, Activity, MessagesSquare, Droplet, Briefcase,
} from "lucide-react";
import styles from "@/app/home.module.css";

// Phase-aware "work" prompt (the productivity nudge from the original For Her).
const WORK_PROMPT: Record<CyclePhase, string> = {
  menstrual: "Lighter load today — save deep work for later in your cycle.",
  follicular: "Energy's climbing — a great week to start big projects.",
  ovulatory: "Focus and confidence peak — book the important conversations.",
  luteal: "Wind things down — protect your focus from overload.",
};

/** No-risk companion carousel: the same card treatment as the plan, minus the
 *  daily tasks — cycle-logging first, then phase-aware cards. Refines over time. */
export function ForHerCompanionHub() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  if (!fh.hydrated) return null;

  const logged = !!fh.cycleLog?.lastPeriod;
  const L = cycleLengthFor(persona);
  const phase: CyclePhase | null = fh.cycleLog?.lastPeriod
    ? phaseForCycleDay(cycleDayFromLog(fh.cycleLog.lastPeriod, L, new Date()), L)
    : null;

  return (
    <FocusCarousel>
        {!logged && (
          <Link href="/cycle" className={`${styles.car} ${styles.carCycle}`} key="setup">
            <span className={styles.carIcon}><Droplet size={22} /></span>
            <h3 className={styles.carTitle}>Set up your tracker</h3>
            <p className={styles.carSub}>Tell us why you&apos;re here so we can tailor your cards.</p>
            <span className={styles.carCta}>Set up now <ArrowRight size={14} /></span>
          </Link>
        )}
        <Link href="/cycle" className={`${styles.car} ${styles.carCycle}`} key="cycle">
          <span className={styles.carIcon}><CalendarHeart size={22} /></span>
          <h3 className={styles.carTitle}>{phase ? `${PHASE_LABEL[phase]} phase` : "Your cycle"}</h3>
          <p className={styles.carSub}>Calendar, phase and next-period prediction.</p>
          <span className={styles.carCta}>Open cycle <ArrowRight size={14} /></span>
        </Link>
        <Link href="/hormones" className={`${styles.car} ${styles.carMood}`} key="hormones">
          <span className={styles.carIcon}><Activity size={22} /></span>
          <h3 className={styles.carTitle}>Hormone rhythm</h3>
          <p className={styles.carSub}>How your hormones move across your cycle.</p>
          <span className={styles.carCta}>Explore <ArrowRight size={14} /></span>
        </Link>
        <Link href="/hormones" className={`${styles.car} ${styles.carLearn}`} key="work">
          <span className={styles.carIcon}><Briefcase size={22} /></span>
          <span className={styles.carEyebrow}>Your day at work</span>
          <h3 className={styles.carTitle}>{phase ? `${PHASE_LABEL[phase]} phase` : "Your cycle"}</h3>
          <p className={styles.carSub}>{phase ? WORK_PROMPT[phase] : "Log your cycle to get phase-based focus tips."}</p>
          <span className={styles.carCta}>See your hormones <ArrowRight size={14} /></span>
        </Link>
        <Link href="/community" className={`${styles.car} ${styles.carCommunity}`} key="community">
          <span className={styles.carIcon}><MessagesSquare size={22} /></span>
          <h3 className={styles.carTitle}>Community</h3>
          <p className={styles.carSub}>Tips and check-ins from women like you.</p>
          <span className={styles.carCta}>Open community <ArrowRight size={14} /></span>
        </Link>
        <Link href="/log/mood" className={`${styles.car} ${styles.carMood}`} key="mood">
          <span className={styles.carIcon}><Moon size={22} /></span>
          <h3 className={styles.carTitle}>Daily check-in</h3>
          <p className={styles.carSub}>Log your mood, energy and symptoms.</p>
          <span className={styles.carCta}>Check in <ArrowRight size={14} /></span>
        </Link>
    </FocusCarousel>
  );
}
