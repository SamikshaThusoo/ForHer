"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan, getTouchpointsDue } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import type { CyclePhase } from "@/types/journey";
import { WINDOW_FOR_CAT, WINDOW_ORDER, WINDOW_LABEL, WINDOW_TIME, hrefForTask, fmtTarget } from "@/lib/forher/taskmeta";
import { FocusCarousel } from "../FocusCarousel/FocusCarousel";
import {
  Moon, ArrowRight, Check, Footprints, TrendingUp, Droplet, MessagesSquare, Stethoscope, FileUp, FlaskConical, CalendarHeart, Briefcase,
} from "lucide-react";
import styles from "@/app/home.module.css";

const ACTION_LABEL: Partial<Record<string, string>> = {
  "food-logger": "Scan / log food",
  scanner: "Scan food",
  learn: "Read today's card",
  community: "Open community",
  consult: "View details",
};
const WORK_PROMPT: Record<CyclePhase, string> = {
  menstrual: "Lighter load today — save deep work for later in your cycle.",
  follicular: "Energy's climbing — a great week to start big projects.",
  ovulatory: "Focus and confidence peak — book the important conversations.",
  luteal: "Wind things down — protect your focus from overload.",
};

const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
function moodLoggedToday(): boolean {
  try {
    const arr = JSON.parse(localStorage.getItem("forher.moodlog.v1") || "[]");
    return Array.isArray(arr) && arr.some((e: { day?: string }) => e.day === todayISO());
  } catch { return false; }
}

/** The ever-changing For Her carousel. Care-plan only. Swipe to move between cards. */
export function ForHerHub() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  if (!fh.hydrated) return null;

  const tasks = resolveDailyPlan(persona, fh.day);
  const winOf = (t: (typeof tasks)[number]) => WINDOW_FOR_CAT[t.category];
  const orderedTasks = [...tasks].sort((a, b) => WINDOW_ORDER.indexOf(winOf(a)) - WINDOW_ORDER.indexOf(winOf(b)));
  const due = getTouchpointsDue(persona, fh.day).filter((t) => t.kind !== "cc-connect");
  const consult = due.find((t) => t.kind === "consult" || t.kind === "baseline");
  const test = due.find((t) => t.kind === "retest");
  const showMood = fh.day % 3 === 1;

  const L = cycleLengthFor(persona);
  const lp = fh.cycleLog?.lastPeriod;
  const cyclePhase: CyclePhase | null = lp ? phaseForCycleDay(cycleDayFromLog(lp, L, new Date()), L) : null;
  const cycleDay = lp ? cycleDayFromLog(lp, L, new Date()) : null;
  const moodDone = moodLoggedToday();

  return (
    <FocusCarousel>
      {!fh.cycleLogged && (
        <Link href="/cycle" className={`${styles.car} ${styles.carCycle}`} key="setup">
          <span className={styles.carIcon}><Droplet size={22} /></span>
          <h3 className={styles.carTitle}>Set up your tracker</h3>
          <p className={styles.carSub}>Tell us why you&apos;re here so we can tailor your cards.</p>
          <span className={styles.carCta}>Set up now <ArrowRight size={14} /></span>
        </Link>
      )}
      {cyclePhase && cycleDay && (
        <div className={`${styles.car} ${styles.carCycle}`} key="cyclestatus">
          <span className={styles.carIcon}><CalendarHeart size={22} /></span>
          <span className={styles.carEyebrow}>Day {cycleDay} of {L} · {PHASE_LABEL[cyclePhase]}</span>
          <h3 className={styles.carTitle}>Cycle added</h3>
          <p className={styles.carSub}>You&apos;re in your {PHASE_LABEL[cyclePhase].toLowerCase()} phase.</p>
          {moodDone
            ? <span className={styles.carCta}><Check size={14} /> Mood logged today</span>
            : <Link href="/log/mood" className={styles.carCta}>Log your mood <ArrowRight size={14} /></Link>}
        </div>
      )}
      {consult && (
        <Link href="/cares/care-team" className={`${styles.car} ${styles.carClinical}`} key="consult">
          <span className={styles.carIcon}><Stethoscope size={22} /></span>
          <span className={styles.carEyebrow}>From your care team</span>
          <h3 className={styles.carTitle}>You have a consult today</h3>
          <p className={styles.carSub}>{consult.label} · 4:00 PM</p>
          <span className={styles.carCta}>View details <ArrowRight size={14} /></span>
        </Link>
      )}
      {consult && (
        <Link href="/cares/care-team" className={`${styles.car} ${styles.carClinical}`} key="rx">
          <span className={styles.carIcon}><FileUp size={22} /></span>
          <span className={styles.carEyebrow}>After your consult</span>
          <h3 className={styles.carTitle}>Add your prescription</h3>
          <p className={styles.carSub}>Upload it and we&apos;ll set your medicine reminders.</p>
          <span className={styles.carCta}>Upload <ArrowRight size={14} /></span>
        </Link>
      )}
      {test && (
        <Link href="/cares/care-team" className={`${styles.car} ${styles.carClinical}`} key="test">
          <span className={styles.carIcon}><FlaskConical size={22} /></span>
          <span className={styles.carEyebrow}>Scheduled test</span>
          <h3 className={styles.carTitle}>Upload your test results</h3>
          <p className={styles.carSub}>Add your labs so your team can review them.</p>
          <span className={styles.carCta}>Upload <ArrowRight size={14} /></span>
        </Link>
      )}
      {orderedTasks.map((t) => {
        // The cycle/mood task is never a generic card — it's the "Set up your tracker"
        // card before logging and the "Cycle added" card after.
        if (t.id === "cycle-mood-log") return null;
        const action = ACTION_LABEL[t.routeTo] ?? (t.routeTo === "cycle-log" ? "Log cycle + mood" : undefined);
        const href = hrefForTask(t);
        const goal = fmtTarget(t.target);
        const isDone = fh.isDone(t.id);
        return (
          <div className={`${styles.car} ${styles.carTask}`} key={t.id}>
            <span className={styles.carEyebrow}>{WINDOW_LABEL[winOf(t)]} · {WINDOW_TIME[winOf(t)]}</span>
            <h3 className={styles.carTitle}>{t.title}</h3>
            {goal && <span className={styles.carGoal}>Today&apos;s goal · {goal}</span>}
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
      {cyclePhase && (
        <Link href="/hormones" className={`${styles.car} ${styles.carLearn}`} key="work">
          <span className={styles.carIcon}><Briefcase size={22} /></span>
          <span className={styles.carEyebrow}>Your day at work</span>
          <h3 className={styles.carTitle}>{PHASE_LABEL[cyclePhase]} phase</h3>
          <p className={styles.carSub}>{WORK_PROMPT[cyclePhase]}</p>
          <span className={styles.carCta}>See your hormones <ArrowRight size={14} /></span>
        </Link>
      )}
      <Link href="/community" className={`${styles.car} ${styles.carCommunity}`} key="community">
        <span className={styles.carIcon}><MessagesSquare size={22} /></span>
        <h3 className={styles.carTitle}>Women in your phase are sharing</h3>
        <p className={styles.carSub}>Tips and check-ins from women like you.</p>
        <span className={styles.carCta}>Open community <ArrowRight size={14} /></span>
      </Link>
      {showMood && !moodDone && (
        <Link href="/log/mood" className={`${styles.car} ${styles.carMood}`} key="mood">
          <span className={styles.carIcon}><Moon size={22} /></span>
          <h3 className={styles.carTitle}>How are you today?</h3>
          <p className={styles.carSub}>A quick mood &amp; symptom check-in.</p>
          <span className={styles.carCta}>Check in <ArrowRight size={14} /></span>
        </Link>
      )}
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
