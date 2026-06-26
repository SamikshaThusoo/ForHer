"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, saveCycleLog, type CycleLog } from "@/lib/forher/state";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { CycleOnboarding } from "@/components/forher/CycleOnboarding/CycleOnboarding";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import styles from "./cycle.module.css";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n: number) => String(n).padStart(2, "0");
const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayNum = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

function readLogged(id: string): string[] {
  try { return JSON.parse(localStorage.getItem(`forher.${id}.loggedperiods`) || "[]"); } catch { return []; }
}
function writeLogged(id: string, set: Set<string>) {
  try { localStorage.setItem(`forher.${id}.loggedperiods`, JSON.stringify([...set])); } catch { /* ignore */ }
}

export default function CyclePage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const today = new Date();
  const [logged, setLogged] = useState<Set<string>>(() => new Set(typeof window === "undefined" ? [] : readLogged(persona.id)));
  const [localCycle, setLocalCycle] = useState<CycleLog | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const cycle = localCycle ?? fh.cycleLog;

  const header = (
    <header className={styles.head}>
      <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
      <span className={styles.brandline}>For Her · Cycle</span>
    </header>
  );

  const toggleDay = (iso: string) => {
    setLogged((prev) => {
      const next = new Set(prev);
      next.has(iso) ? next.delete(iso) : next.add(iso);
      writeLogged(persona.id, next);
      return next;
    });
  };

  if (!fh.hydrated) return <main className={`${styles.page} fhTheme`}>{header}</main>;

  // ---- Not set up yet → onboard. Saving seeds the period days, then shows the calendar. ----
  if (!cycle) {
    return (
      <main className={`${styles.page} fhTheme`}>
        {header}
        <div className={styles.hero}>
          <h1 className={styles.h1}>Your <em>cycle</em></h1>
          <p className={styles.introSub}>We won&apos;t show a phase until you&apos;ve logged your cycle — no guessing on our part.</p>
        </div>
        <CycleOnboarding onSave={(log) => {
          saveCycleLog(persona.id, log);
          if (log.lastPeriod && log.duration) {
            const start = fromISO(log.lastPeriod);
            const next = new Set(logged);
            for (let i = 0; i < log.duration; i++) next.add(localISO(addDays(start, i)));
            setLogged(next);
            writeLogged(persona.id, next);
          }
          setLocalCycle(log); // stay here and show the calendar
        }} />
      </main>
    );
  }

  // ---- Pregnant → no cycle tracking; pregnancy progress + Tulip ----
  if (cycle.intent === "pregnant") {
    const weeks = cycle.weeksPregnant ?? 0;
    const trimester = weeks <= 13 ? "First" : weeks <= 27 ? "Second" : "Third";
    return (
      <main className={`${styles.page} fhTheme`}>
        {header}
        <div className={styles.hero}>
          <h1 className={styles.h1}>Your <em>pregnancy</em></h1>
          <p className={styles.introSub}>We&apos;ve paused cycle tracking — here&apos;s what matters now.</p>
        </div>
        <div className={styles.pregCard}>
          <div><span className={styles.pregWeeks}>{weeks}</span><span className={styles.pregUnit}> weeks</span></div>
          <span className={styles.pregTri}>{trimester} trimester</span>
        </div>
        <Link href="/cares/care-team" className={styles.tulipCard}>
          <span className={styles.tulipEyebrow}>Recommended for you</span>
          <h3 className={styles.tulipTitle}>Tulip — pregnancy care with PCOS</h3>
          <p className={styles.tulipSub}>PCOS can raise some pregnancy risks. Tulip adds closer monitoring and a dedicated team.</p>
          <span className={styles.tulipCta}>Explore Tulip →</span>
        </Link>
      </main>
    );
  }

  // ---- Track / TTC calendar ----
  const L = cycleLengthFor(persona);
  const duration = cycle.duration ?? 5;
  const ovCd = Math.floor(L / 2);

  // Anchor = most recent period start (a logged day whose previous day isn't logged), on/before today.
  const sorted = [...logged].sort();
  const starts = sorted.filter((s) => !logged.has(localISO(addDays(fromISO(s), -1))));
  const pastStarts = starts.filter((s) => dayNum(fromISO(s)) <= dayNum(today));
  const anchorISO = pastStarts.length ? pastStarts[pastStarts.length - 1] : (cycle.lastPeriod ?? localISO(today));
  const anchor = fromISO(anchorISO);

  // Predicted future periods.
  const predicted = new Set<string>();
  for (let k = 1; k <= 4; k++) {
    const ps = addDays(anchor, k * L);
    for (let i = 0; i < duration; i++) predicted.add(localISO(addDays(ps, i)));
  }

  const todayCd = cycleDayFromLog(anchorISO, L, today);
  const todayPhase = phaseForCycleDay(todayCd, L);
  const nextStart = addDays(anchor, dayNum(today) - dayNum(anchor) < L ? L : Math.ceil((dayNum(today) - dayNum(anchor) + 1) / L) * L);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const daysToOv = ((ovCd - todayCd) % L + L) % L;
  const ovDate = addDays(today, daysToOv);

  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

  const renderMonth = (m: Date) => {
    const year = m.getFullYear(); const month = m.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    return (
      <div className={styles.month} key={`${year}-${month}`}>
        <div className={styles.grid}>
          {WEEKDAYS.map((w, i) => <span key={`w${i}`} className={styles.wd}>{w}</span>)}
          {cells.map((d, i) => {
            if (d == null) return <span key={i} />;
            const date = new Date(year, month, d);
            const iso = localISO(date);
            const isLogged = logged.has(iso);
            const isPred = !isLogged && predicted.has(iso);
            const cd = cycleDayFromLog(anchorISO, L, date);
            const isOv = cd === ovCd;
            // Ovulation/fertile window shown for everyone, not just TTC.
            const isFertile = !isLogged && !isPred && cd >= ovCd - 4 && cd <= ovCd + 1;
            const isToday = iso === localISO(today);
            return (
              <button key={i} type="button" onClick={() => toggleDay(iso)}
                className={[styles.day,
                  isLogged ? styles.dayLogged : "",
                  isPred ? styles.dayPred : "",
                  isFertile ? styles.dayFertile : "",
                  isOv ? styles.dayOv : "",
                  isToday ? styles.dayToday : ""].filter(Boolean).join(" ")}>
                {d}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <main className={`${styles.page} fhTheme`}>
      {header}

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your <em>cycle</em></h1>
        <div className={styles.summary}>
          <span className={styles.dayChip}>Day {todayCd} of {L}</span>
          <span className={styles.todayPill}>{PHASE_LABEL[todayPhase]} phase</span>
        </div>
        <p className={styles.nextNote}>Next period ~ {fmt(nextStart)} · Ovulation ~ {fmt(ovDate)}</p>
      </div>

      <p className={styles.tapHint}>Tap a day to add or remove a period day. Future periods are predicted (outlined).</p>

      <div className={styles.monthNav}>
        <button type="button" className={styles.monthNavBtn} onClick={() => setMonthOffset((o) => Math.max(-3, o - 1))} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <span className={styles.monthNavLabel}>{viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
        <button type="button" className={styles.monthNavBtn} onClick={() => setMonthOffset((o) => Math.min(10, o + 1))} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>
      {renderMonth(viewMonth)}

      <div className={styles.legend}>
        <span className={styles.legItem}><span className={`${styles.legDot} ${styles.dayLogged}`} />Period</span>
        <span className={styles.legItem}><span className={`${styles.legDot} ${styles.dayPred}`} />Predicted</span>
        <span className={styles.legItem}><span className={`${styles.legDot} ${styles.dayFertile}`} />Fertile</span>
        <span className={styles.legItem}><span className={`${styles.legDot} ${styles.dayOv}`} />Ovulation</span>
      </div>

      <Link href="/hormones" className={styles.nextBtn}>Next · your hormone rhythm <ArrowRight size={16} /></Link>
    </main>
  );
}
