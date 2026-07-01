"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, saveCycleLog, type CycleLog } from "@/lib/forher/state";
import {
  cycleLengthFor, cycleDayFromLog, phaseForCycleDay, ovulationDay, PHASE_LABEL, PHASE_COLOR,
} from "@/lib/forher/cycleview";
import { readDayLog, writeDayLog, periodDaysSet, isEmptyEntry, type DayLog, type DayEntry } from "@/lib/forher/daylog";
import type { CyclePhase } from "@/types/journey";
import { CycleOnboarding } from "@/components/forher/CycleOnboarding/CycleOnboarding";
import { CycleRing } from "@/components/forher/CycleRing/CycleRing";
import { DayLogSheet } from "@/components/forher/DayLogSheet/DayLogSheet";
import { Florette, BloodDrop } from "@/components/forher/CycleArt/CycleArt";
import { ChevronLeft, ChevronRight, ArrowRight, RotateCcw } from "lucide-react";
import styles from "./cycle.module.css";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const OV_TILE = "#2F6B45"; // deep fertile-green for the ovulation florette on the calendar
const pad = (n: number) => String(n).padStart(2, "0");
const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayNum = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

const INSIGHT: Record<CyclePhase, string> = {
  menstrual: "Energy is naturally lower right now. Rest counts as progress.",
  follicular: "Estrogen is climbing. A good window to start something new.",
  ovulatory: "Estrogen peaks and energy is high. Lean into the big conversations.",
  luteal: "Winding down. Gentle movement and earlier nights help.",
};

export default function CyclePage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const reduce = useReducedMotion();
  const today = new Date();
  const [dayLog, setDayLog] = useState<DayLog>(() => (typeof window === "undefined" ? {} : readDayLog(persona.id)));
  const [localCycle, setLocalCycle] = useState<CycleLog | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selCd, setSelCd] = useState<number | null>(null); // scrubbed cycle day (null = today)
  const [sheetISO, setSheetISO] = useState<string | null>(null); // open day-log sheet
  const navDir = useRef(1);
  const cycle = localCycle ?? fh.cycleLog;
  const logged = useMemo(() => periodDaysSet(dayLog), [dayLog]); // period days feed the cycle math

  const header = (
    <header className={styles.head}>
      <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
      <span className={styles.brandline}>For Her · Cycle</span>
    </header>
  );

  // Focus the trigger first so the sheet can return focus to it on close
  // (buttons don't always focus on click in Safari/Firefox).
  const openSheet = (iso: string, trigger: HTMLElement) => {
    trigger.focus();
    setSheetISO(iso);
  };
  const saveDay = (iso: string, entry: DayEntry) => {
    setDayLog((prev) => {
      const next = { ...prev };
      if (isEmptyEntry(entry)) delete next[iso];
      else next[iso] = entry;
      writeDayLog(persona.id, next);
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
            const next: DayLog = { ...dayLog };
            for (let i = 0; i < log.duration; i++) {
              const iso = localISO(addDays(start, i));
              next[iso] = { ...(next[iso] ?? {}), period: true };
            }
            setDayLog(next);
            writeDayLog(persona.id, next);
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
  const L = cycleLengthFor(persona, cycle.cycleLength);
  const duration = cycle.duration ?? 5;
  const ovCd = ovulationDay(L);

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
  const cycleDay = selCd ?? todayCd;            // the day the ring + insight reflect
  const scrubPhase = phaseForCycleDay(cycleDay, L, duration);
  const isToday = cycleDay === todayCd;
  const hasSel = selCd !== null;
  const selISO = localISO(addDays(anchor, cycleDay - 1)); // calendar day in sync with the scrubber

  const nextStart = addDays(anchor, dayNum(today) - dayNum(anchor) < L ? L : Math.ceil((dayNum(today) - dayNum(anchor) + 1) / L) * L);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const daysToOv = ((ovCd - todayCd) % L + L) % L;
  const ovDate = addDays(today, daysToOv);
  const periodIn = dayNum(nextStart) - dayNum(today);
  const rel = (n: number) => (n <= 0 ? "today" : `in ${n} day${n === 1 ? "" : "s"}`);

  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const insightColor = PHASE_COLOR[scrubPhase];

  const renderMonth = (m: Date) => {
    const year = m.getFullYear(); const month = m.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    return (
      <div className={styles.grid}>
        {WEEKDAYS.map((w, i) => <span key={`w${i}`} className={styles.wd}>{w}</span>)}
        {cells.map((d, i) => {
          if (d == null) return <span key={i} />;
          const date = new Date(year, month, d);
          const iso = localISO(date);
          const isLogged = logged.has(iso);
          const isPred = !isLogged && predicted.has(iso);
          const cd = cycleDayFromLog(anchorISO, L, date);
          // cd repeats in both directions, so gate fertile/ovulation to the
          // logged period forward — otherwise the green backfills into earlier
          // months (predicted periods are already forward-only).
          const fromAnchor = dayNum(date) >= dayNum(anchor);
          const isOv = fromAnchor && cd === ovCd;
          // Ovulation/fertile window shown for everyone, not just TTC.
          const isFertile = fromAnchor && !isLogged && !isPred && cd >= ovCd - 5 && cd <= ovCd;
          const isTodayCell = iso === localISO(today);
          const isSel = hasSel && iso === selISO;
          return (
            <motion.button key={i} type="button" whileTap={{ scale: 0.85 }}
              onClick={(e) => { setSelCd(cycleDayFromLog(anchorISO, L, date)); openSheet(iso, e.currentTarget); }}
              aria-label={`Log ${date.toLocaleDateString(undefined, { day: "numeric", month: "long" })}`}
              aria-haspopup="dialog"
              className={[styles.day,
                isLogged ? styles.dayLogged : "",
                isPred ? styles.dayPred : "",
                isFertile ? styles.dayFertile : "",
                isOv && !isLogged ? styles.dayOv : "",
                isTodayCell ? styles.dayToday : "",
                isSel ? styles.daySel : ""].filter(Boolean).join(" ")}>
              <span className={styles.dayNum}>{d}</span>
              {isLogged && <span className={styles.dayArt}><BloodDrop size={12} /></span>}
              {isPred && <span className={styles.dayArt}><BloodDrop size={11} fill={false} /></span>}
              {isOv && !isLogged && <span className={styles.dayArt}><Florette size={13} color={OV_TILE} bloom /></span>}
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <main className={`${styles.page} fhTheme`}>
      {header}

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your <em>cycle</em></h1>
      </div>

      <CycleRing L={L} cycleDay={cycleDay} todayCd={todayCd} duration={duration} onPhaseTap={(day) => setSelCd(day)} />

      <div className={styles.scrubWrap}>
        <input
          className={styles.scrub} type="range" min={1} max={L} value={cycleDay}
          onChange={(e) => setSelCd(Number(e.target.value))} aria-label="Scrub through your cycle"
        />
        <div className={styles.scrubMeta}>
          <span className={styles.scrubHint}>Drag to explore any day in your cycle</span>
          {hasSel && selCd !== todayCd && (
            <button type="button" className={styles.backToday} onClick={() => setSelCd(null)}>
              <RotateCcw size={12} /> Back to today
            </button>
          )}
        </div>
      </div>

      <div className={styles.chips}>
        <div className={styles.chip}>
          <span className={styles.chipIcon}><BloodDrop size={19} /></span>
          <span className={styles.chipText}>
            <span className={styles.chipLabel}>Next period</span>
            <span className={styles.chipVal}>{fmt(nextStart)} · {rel(periodIn)}</span>
          </span>
        </div>
        <div className={styles.chip}>
          <span className={styles.chipIcon}><Florette size={19} color="#4F9D69" /></span>
          <span className={styles.chipText}>
            <span className={styles.chipLabel}>Ovulation</span>
            <span className={styles.chipVal}>{fmt(ovDate)} · {rel(daysToOv)}</span>
          </span>
        </div>
      </div>

      <div className={styles.insight} style={{ background: `${insightColor}14`, borderColor: `${insightColor}33` }}>
        <span className={styles.insightTag} style={{ color: insightColor }}>
          {PHASE_LABEL[scrubPhase]} phase{isToday ? " · today" : ""}
        </span>
        <p className={styles.insightText}>{INSIGHT[scrubPhase]}</p>
      </div>

      <p className={styles.tapHint}>Tap any day to log your flow &amp; symptoms. Future periods are predicted (outlined).</p>

      <div className={styles.monthNav}>
        <button type="button" className={styles.monthNavBtn} onClick={() => { navDir.current = -1; setMonthOffset((o) => Math.max(-3, o - 1)); }} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <span className={styles.monthNavLabel}>{viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
        <button type="button" className={styles.monthNavBtn} onClick={() => { navDir.current = 1; setMonthOffset((o) => Math.min(10, o + 1)); }} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>

      <div className={styles.month}>
        <AnimatePresence mode="wait" initial={false} custom={navDir.current}>
          <motion.div
            key={`${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
            custom={navDir.current}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: navDir.current > 0 ? 26 : -26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: navDir.current > 0 ? -26 : 26 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderMonth(viewMonth)}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.legend}>
        <span className={styles.legItem}><span className={styles.legArt}><BloodDrop size={15} /></span>Period</span>
        <span className={styles.legItem}><span className={styles.legArt}><BloodDrop size={14} fill={false} /></span>Predicted</span>
        <span className={styles.legItem}><span className={`${styles.legDot} ${styles.legFertile}`} />Fertile</span>
        <span className={styles.legItem}><span className={styles.legArt}><Florette size={15} color={OV_TILE} /></span>Ovulation</span>
      </div>

      <Link href="/hormones" className={styles.nextBtn}>Next · your hormone rhythm <ArrowRight size={16} /></Link>

      <DayLogSheet
        dateISO={sheetISO}
        entry={sheetISO ? (dayLog[sheetISO] ?? {}) : {}}
        labelDate={sheetISO ? fromISO(sheetISO).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long" }) : ""}
        onSave={saveDay}
        onClose={() => setSheetISO(null)}
      />
    </main>
  );
}
