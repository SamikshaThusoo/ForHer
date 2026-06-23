"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { BottomNav } from "@/components/forher/BottomNav/BottomNav";
import {
  cycleDayForDate, cycleLengthFor, phaseForCycleDay, nextPeriodDate,
  PHASE_COLOR, PHASE_LABEL,
} from "@/lib/forher/cycleview";
import type { CyclePhase } from "@/types/journey";
import { ChevronLeft, Plus, Check } from "lucide-react";
import styles from "./cycle.module.css";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const PHASES: CyclePhase[] = ["menstrual", "follicular", "ovulatory", "luteal"];
const iso = (d: Date) => d.toISOString().slice(0, 10);

function readLogged(id: string): string[] {
  try { return JSON.parse(localStorage.getItem(`forher.${id}.loggedperiods`) || "[]"); } catch { return []; }
}

export default function CyclePage() {
  const { persona } = usePersona();
  const today = new Date();
  const [logged, setLogged] = useState<string[]>(() => (typeof window === "undefined" ? [] : readLogged(persona.id)));

  const L = cycleLengthFor(persona);
  const todayPhase = phaseForCycleDay(cycleDayForDate(persona, today), L);
  const next = nextPeriodDate(persona, today);

  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const logToday = () => {
    const key = iso(today);
    if (logged.includes(key)) return;
    const next = [...logged, key];
    setLogged(next);
    try { localStorage.setItem(`forher.${persona.id}.loggedperiods`, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const loggedToday = logged.includes(iso(today));

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/forher" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · Cycle</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your <em>cycle</em></h1>
        <div className={styles.summary}>
          <span className={styles.todayPill} style={{ background: PHASE_COLOR[todayPhase] }}>{PHASE_LABEL[todayPhase]} phase</span>
          <span className={styles.nextNote}>Next period ~ {next.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
        </div>
      </div>

      <div className={styles.calendar}>
        <div className={styles.monthLabel}>{today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
        <div className={styles.grid}>
          {WEEKDAYS.map((w, i) => <span key={i} className={styles.wd}>{w}</span>)}
          {cells.map((d, i) => {
            if (d == null) return <span key={i} />;
            const date = new Date(year, month, d);
            const cd = cycleDayForDate(persona, date);
            const phase = phaseForCycleDay(cd, L);
            const isToday = d === today.getDate();
            const isPeriod = phase === "menstrual" || logged.includes(iso(date));
            return (
              <span
                key={i}
                className={`${styles.day} ${isToday ? styles.dayToday : ""}`}
                style={{ background: isPeriod ? PHASE_COLOR.menstrual : `${PHASE_COLOR[phase]}22`, color: isPeriod ? "#fff" : "#3E1B33" }}
              >
                {d}
              </span>
            );
          })}
        </div>
      </div>

      <button type="button" className={styles.logBtn} onClick={logToday} disabled={loggedToday}>
        {loggedToday ? <><Check size={16} /> Period logged today</> : <><Plus size={16} /> Log period today</>}
      </button>

      <div className={styles.legend}>
        {PHASES.map((p) => (
          <span key={p} className={styles.legItem}>
            <span className={styles.legDot} style={{ background: PHASE_COLOR[p] }} />{PHASE_LABEL[p]}
          </span>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
