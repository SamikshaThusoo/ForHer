"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan, getPlanTouchpoints, getPhase } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { readDayLog } from "@/lib/forher/daylog";
import { nextVisit } from "@/lib/forher/progressview";
import { CheckCircle2, CalendarHeart, Stethoscope, Moon, Activity } from "lucide-react";
import styles from "@/app/progress/progress.module.css";

const PHASE_NAME: Record<string, string> = { foundation: "Foundation", build: "Build", milestone: "Milestone" };
const todayISO = () => new Date().toISOString().slice(0, 10);

function todayMood(): string[] | null {
  try {
    const arr = JSON.parse(localStorage.getItem("forher.moodlog.v1") || "[]");
    const e = Array.isArray(arr) ? [...arr].reverse().find((x: { day?: string }) => x.day === todayISO()) : null;
    return e ? (e.feelings ?? []) : null;
  } catch {
    return null;
  }
}

export function DailyView() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  if (!fh.hydrated) return null;

  const day = fh.day;
  const plan = resolveDailyPlan(persona, day);
  const doneToday = fh.done[day] ?? [];
  const completed = plan.filter((t) => doneToday.includes(t.id));
  const tasksTotal = plan.length;
  const tasksDone = completed.length;
  const daysActive = Object.values(fh.done).filter((a) => a.length > 0).length;
  const isStart = fh.streak === 0 && tasksDone === 0 && daysActive === 0;

  const dayLog = readDayLog(persona.id);
  const mood = todayMood();
  const symptomsToday = dayLog[todayISO()]?.symptoms ?? [];

  const lp = fh.cycleLog?.lastPeriod;
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const cycleDay = lp ? cycleDayFromLog(lp, L, new Date()) : null;
  const cyclePhase = lp ? phaseForCycleDay(cycleDay!, L, fh.cycleLog?.duration ?? 5) : null;

  const upcoming = nextVisit(getPlanTouchpoints(persona), day);
  const inDays = upcoming ? upcoming.day - day : null;

  return (
    <div className={styles.daily}>
      <div className={styles.sectionHead}>Today&apos;s recap</div>
      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statNum}>{fh.streak}</span><span className={styles.statLab}>day streak</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{tasksDone}/{tasksTotal}</span><span className={styles.statLab}>tasks today</span></div>
        <div className={styles.stat}><span className={styles.statNum}>{daysActive}</span><span className={styles.statLab}>active days</span></div>
      </div>
      {isStart && <p className={styles.startLine}>Day 1 — your streak starts today. One task counts.</p>}

      <div className={styles.dCard}>
        <span className={styles.dLabel}>What you did today</span>
        {tasksDone > 0 ? (
          <ul className={styles.dList}>
            {completed.map((t) => (
              <li key={t.id} className={styles.dDone}><CheckCircle2 size={14} /> {t.title}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.dMuted}>No tasks ticked yet — <Link href="/">pick one</Link>.</p>
        )}
        <p className={styles.dRow}><Moon size={14} /> {mood ? (mood.length ? `Mood: ${mood.slice(0, 3).join(", ").toLowerCase()}` : "Mood logged") : "Mood not logged"}</p>
        <p className={styles.dRow}><Activity size={14} /> {symptomsToday.length ? `Symptoms: ${symptomsToday.length} logged` : "No symptoms logged today"}</p>
      </div>

      <div className={styles.dCard}>
        <span className={styles.dLabel}>Where you are</span>
        <p className={styles.dRow}><CalendarHeart size={14} /> {cyclePhase ? `Cycle day ${cycleDay} · ${PHASE_LABEL[cyclePhase]}` : "Cycle not set up"}</p>
        <p className={styles.dRow}><Activity size={14} /> Day {day} of 90 · {PHASE_NAME[getPhase(day)]} phase</p>
      </div>

      <div className={styles.dCard}>
        <span className={styles.dLabel}>Upcoming</span>
        {upcoming ? (
          <p className={styles.dRow}><Stethoscope size={14} /> {upcoming.label} · {inDays === 0 ? "today" : `in ${inDays} day${inDays === 1 ? "" : "s"}`}</p>
        ) : (
          <p className={styles.dMuted}>No appointments left in your plan.</p>
        )}
      </div>
    </div>
  );
}
