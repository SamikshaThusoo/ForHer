"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, saveCycleLog, type CycleLog } from "@/lib/forher/state";
import {
  cycleLengthFor, cycleDayFromLog, phaseForCycleDay,
  PHASE_COLOR, PHASE_LABEL, PHASE_PROSE,
} from "@/lib/forher/cycleview";
import { CycleOnboarding } from "@/components/forher/CycleOnboarding/CycleOnboarding";
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
  const fh = useForHer(persona.id);
  const today = new Date();
  const [logged, setLogged] = useState<string[]>(() => (typeof window === "undefined" ? [] : readLogged(persona.id)));
  const [selected, setSelected] = useState<number>(today.getDate());
  const [localCycle, setLocalCycle] = useState<CycleLog | null>(null);

  const cycle = localCycle ?? fh.cycleLog;

  const header = (
    <header className={styles.head}>
      <Link href="/forher" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
      <span className={styles.brandline}>For Her · Cycle</span>
    </header>
  );

  if (!fh.hydrated) return <main className={`${styles.page} fhTheme`}>{header}</main>;

  // ---- Not set up yet → onboard (this is what unlocks phase prediction) ----
  if (!cycle) {
    return (
      <main className={`${styles.page} fhTheme`}>
        {header}
        <div className={styles.hero}>
          <h1 className={styles.h1}>Your <em>cycle</em></h1>
          <p className={styles.introSub}>We won&apos;t show a phase until you&apos;ve logged your cycle — no guessing on our part.</p>
        </div>
        <CycleOnboarding onSave={(lp, dur) => { saveCycleLog(persona.id, lp, dur); setLocalCycle({ lastPeriod: lp, duration: dur }); }} />
      </main>
    );
  }

  const L = cycleLengthFor(persona);
  const cdFor = (date: Date) => cycleDayFromLog(cycle.lastPeriod, L, date);
  const todayPhase = phaseForCycleDay(cdFor(today), L);
  const todayCd = cdFor(today);
  const daysToStart = todayCd === 1 ? 0 : L - todayCd + 1;
  const next = new Date(today.getTime() + daysToStart * 86400000);

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
    const nextLogged = [...logged, key];
    setLogged(nextLogged);
    try { localStorage.setItem(`forher.${persona.id}.loggedperiods`, JSON.stringify(nextLogged)); } catch { /* ignore */ }
  };
  const loggedToday = logged.includes(iso(today));

  const selDate = new Date(year, month, selected);
  const selCd = cdFor(selDate);
  const selPhase = phaseForCycleDay(selCd, L);
  const selPeriod = selPhase === "menstrual" || logged.includes(iso(selDate));

  return (
    <main className={`${styles.page} fhTheme`}>
      {header}

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
            const phase = phaseForCycleDay(cdFor(date), L);
            const isToday = d === today.getDate();
            const isPeriod = phase === "menstrual" || logged.includes(iso(date));
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(d)}
                className={`${styles.day} ${isToday ? styles.dayToday : ""} ${selected === d ? styles.daySel : ""}`}
                style={{ background: isPeriod ? PHASE_COLOR.menstrual : `${PHASE_COLOR[phase]}22`, color: isPeriod ? "#fff" : "#3E1B33" }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.detail} style={{ borderLeftColor: PHASE_COLOR[selPhase] }}>
        <div className={styles.detailTop}>
          <span className={styles.detailDate}>{selDate.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>
          <span className={styles.detailPhase} style={{ color: PHASE_COLOR[selPhase] }}>
            Cycle day {selCd} · {PHASE_LABEL[selPhase]}
          </span>
        </div>
        <p className={styles.detailBody}>{selPeriod ? "Period likely on this day. " : ""}{PHASE_PROSE[selPhase]}</p>
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
    </main>
  );
}
