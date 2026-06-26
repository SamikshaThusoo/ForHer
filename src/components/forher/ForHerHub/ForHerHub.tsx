"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan, getTouchpointsDue } from "@/lib/journey";
import { WINDOW_FOR_CAT, WINDOW_ORDER, WINDOW_LABEL, WINDOW_TIME, hrefForTask } from "@/lib/forher/taskmeta";
import { FocusCarousel } from "../FocusCarousel/FocusCarousel";
import {
  ScanLine, Moon, ArrowRight, Check, Footprints, TrendingUp, Droplet, MessagesSquare, Stethoscope,
} from "lucide-react";
import styles from "@/app/home.module.css";

// Tasks that route somewhere show that action (e.g. "Scan / log food") instead of
// a bare "Mark done".
const ACTION_LABEL: Partial<Record<string, string>> = {
  "food-logger": "Scan / log food",
  scanner: "Scan food",
  "cycle-log": "Log cycle + mood",
  learn: "Read today's card",
  community: "Open community",
  consult: "View details",
};

/** The ever-changing For Her carousel. Shared by the /forher dashboard and the
 *  For Her card on the Habit home. Swipe to move between cards. Care-plan only. */
export function ForHerHub() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  if (!fh.hydrated) return null;

  const tasks = resolveDailyPlan(persona, fh.day);
  const winOf = (t: (typeof tasks)[number]) => WINDOW_FOR_CAT[t.category];
  const orderedTasks = [...tasks].sort((a, b) => WINDOW_ORDER.indexOf(winOf(a)) - WINDOW_ORDER.indexOf(winOf(b)));
  const setupShown = !fh.cycleLogged;
  const due = getTouchpointsDue(persona, fh.day).filter((t) => t.kind !== "cc-connect");

  return (
    <FocusCarousel>
      {setupShown && (
        <Link href="/cycle" className={`${styles.car} ${styles.carCycle}`} key="setup">
          <span className={styles.carIcon}><Droplet size={22} /></span>
          <h3 className={styles.carTitle}>Set up your tracker</h3>
          <p className={styles.carSub}>Tell us why you&apos;re here so we can tailor your cards.</p>
          <span className={styles.carCta}>Set up now <ArrowRight size={14} /></span>
        </Link>
      )}
      {due.length > 0 && (
        <Link href="/cares/care-team" className={`${styles.car} ${styles.carClinical}`} key="clinical">
          <span className={styles.carIcon}><Stethoscope size={22} /></span>
          <span className={styles.carEyebrow}>From your care team</span>
          <h3 className={styles.carTitle}>You have a consult today</h3>
          <p className={styles.carSub}>{due[0].label} · 4:00 PM</p>
          <span className={styles.carCta}>View details <ArrowRight size={14} /></span>
        </Link>
      )}
      {orderedTasks.map((t) => {
        const action = ACTION_LABEL[t.routeTo];
        const href = hrefForTask(t);
        const isDone = fh.isDone(t.id);
        return (
          <div className={`${styles.car} ${styles.carTask}`} key={t.id}>
            <span className={styles.carEyebrow}>{WINDOW_LABEL[winOf(t)]} · {WINDOW_TIME[winOf(t)]}</span>
            <h3 className={styles.carTitle}>{t.title}</h3>
            <p className={styles.carSub}>{t.detail}</p>
            {action && href ? (
              <Link href={href} className={styles.carCheck}>{action} <ArrowRight size={14} /></Link>
            ) : (
              <button type="button"
                className={`${styles.carCheck} ${isDone ? styles.carCheckOn : ""}`}
                onClick={() => fh.toggleDone(t.id)}>
                {isDone ? <><Check size={15} /> Done</> : "Mark done"}
              </button>
            )}
          </div>
        );
      })}
      <Link href="/community" className={`${styles.car} ${styles.carCommunity}`} key="community">
        <span className={styles.carIcon}><MessagesSquare size={22} /></span>
        <h3 className={styles.carTitle}>Women in your phase are sharing</h3>
        <p className={styles.carSub}>Tips and check-ins from women like you.</p>
        <span className={styles.carCta}>Open community <ArrowRight size={14} /></span>
      </Link>
      <Link href="/cares/scan" className={`${styles.car} ${styles.carScan}`} key="scan">
        <span className={styles.carIcon}><ScanLine size={22} /></span>
        <h3 className={styles.carTitle}>What&apos;s in your food?</h3>
        <p className={styles.carSub}>Scan a snack for a PMOS-aware verdict.</p>
        <span className={styles.carCta}>Scan food <ArrowRight size={14} /></span>
      </Link>
      <Link href="/log/mood" className={`${styles.car} ${styles.carMood}`} key="mood">
        <span className={styles.carIcon}><Moon size={22} /></span>
        <h3 className={styles.carTitle}>How are you today?</h3>
        <p className={styles.carSub}>Log your mood, symptoms and cycle in 15 seconds.</p>
        <span className={styles.carCta}>Quick check-in <ArrowRight size={14} /></span>
      </Link>
      <div className={`${styles.car} ${styles.carSteps}`} key="steps">
        <span className={styles.carIcon}><Footprints size={22} /></span>
        <h3 className={styles.carTitle}>8,240 / 10,000 steps</h3>
        <p className={styles.carSub}>From your Habit activity — 82% of today&apos;s goal.</p>
      </div>
      <Link href="/progress" className={`${styles.car} ${styles.carMood}`} key="progress">
        <span className={styles.carIcon}><TrendingUp size={22} /></span>
        <h3 className={styles.carTitle}>See today&apos;s progress</h3>
        <p className={styles.carSub}>Habits you&apos;re building + the markers that move.</p>
        <span className={styles.carCta}>See progress <ArrowRight size={14} /></span>
      </Link>
    </FocusCarousel>
  );
}
