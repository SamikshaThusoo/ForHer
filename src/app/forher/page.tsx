"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan, personaTrack } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay } from "@/lib/forher/cycleview";
import { WINDOW_FOR_CAT, WINDOW_ORDER, WINDOW_LABEL, WINDOW_TIME } from "@/lib/forher/taskmeta";
import { ForHerEntryCard } from "@/components/forher/ForHerEntryCard/ForHerEntryCard";
import { FocusCarousel } from "@/components/forher/FocusCarousel/FocusCarousel";
import {
  Flame, Moon, ScanLine, CalendarHeart, Activity, MessagesSquare, ArrowRight, ChevronLeft, Check, Footprints, Map, Droplet, TrendingUp,
} from "lucide-react";
import styles from "../home.module.css";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ForHerHome() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const track = personaTrack(persona);
  const [active, setActive] = useState(0); // centred carousel card
  const [scrollTo, setScrollTo] = useState<{ idx: number } | undefined>(undefined); // bar-driven scroll

  const backHabit = (
    <Link href="/" className={styles.backHabit}><ChevronLeft size={15} /> Habit Health</Link>
  );

  if (!fh.hydrated) return <main className={`${styles.home} fhTheme`} />;

  // ---- STATE 1: not assessed → welcome ----
  if (!fh.assessed) {
    return (
      <main className={`${styles.home} fhTheme`}>
        {backHabit}
        <header className={styles.top}>
          <div className={styles.wordmark}>For Her <span className={styles.tag}>PMOS</span></div>
        </header>
        <section className={styles.hero}>
          <p className={styles.hi}>Hi {persona.shortName}</p>
          <h1 className={styles.h1}>Your cycle &amp; hormones, <em>handled with care</em></h1>
          <p className={styles.lead}>A guided PMOS program — understand your risk, then follow a plan that fits your everyday.</p>
          <p className={styles.aka}><strong>PMOS</strong> (Polyendocrine Metabolic Ovarian Syndrome) — the condition you may know as <strong>PCOS</strong>.</p>
        </section>
        <ForHerEntryCard />
      </main>
    );
  }

  // Cycle phase comes ONLY from her logged cycle — until she's set it up, we
  // prompt setup instead of showing a phase.
  const L = cycleLengthFor(persona);
  const cyclePhase = fh.cycleLog
    ? phaseForCycleDay(cycleDayFromLog(fh.cycleLog.lastPeriod, L, new Date()), L)
    : null;
  const phaseChip = cyclePhase
    ? <span className={styles.cyclePill}>{cap(cyclePhase)} phase</span>
    : <Link href="/cycle" className={styles.setupPill}>Set up your cycle →</Link>;
  const setupCard = !fh.cycleLogged ? (
    <Link href="/cycle" className={`${styles.car} ${styles.carCycle}`} key="setup">
      <span className={styles.carIcon}><Droplet size={22} /></span>
      <h3 className={styles.carTitle}>Set up your cycle</h3>
      <p className={styles.carSub}>Log your last period so we can predict your phases.</p>
      <span className={styles.carCta}>Set up now <ArrowRight size={14} /></span>
    </Link>
  ) : null;

  // ---- STATE 3: assessed, no risk → companion ----
  if (track === "none") {
    return (
      <main className={`${styles.home} fhTheme`}>
        {backHabit}
        <header className={styles.dashTop}>
          <div className={styles.wordmark}>For Her <span className={styles.tag}>PMOS</span></div>
        </header>
        <section className={styles.dashHero}>
          <p className={styles.hi}>Hi {persona.shortName}</p>
          <div className={styles.phaseRow}>{phaseChip}</div>
          <h2 className={styles.dashH2}>You&apos;re in <em>good shape</em></h2>
          <p className={styles.lead}>No daily plan needed right now — keep tracking your cycle and we&apos;ll re-check over time.</p>
        </section>

        <FocusCarousel>
          {setupCard}
          <Link href="/cycle" className={`${styles.car} ${styles.carScan}`} key="cycle">
            <span className={styles.carIcon}><CalendarHeart size={22} /></span>
            <h3 className={styles.carTitle}>Your cycle</h3>
            <p className={styles.carSub}>Calendar, phase and next-period prediction.</p>
            <span className={styles.carCta}>Open cycle <ArrowRight size={14} /></span>
          </Link>
          <Link href="/hormones" className={`${styles.car} ${styles.carMood}`} key="hormones">
            <span className={styles.carIcon}><Activity size={22} /></span>
            <h3 className={styles.carTitle}>Hormone rhythm</h3>
            <p className={styles.carSub}>How your hormones move across your cycle.</p>
            <span className={styles.carCta}>Explore <ArrowRight size={14} /></span>
          </Link>
          <Link href="/community" className={`${styles.car} ${styles.carCommunity}`} key="community">
            <span className={styles.carIcon}><MessagesSquare size={22} /></span>
            <h3 className={styles.carTitle}>Community</h3>
            <p className={styles.carSub}>Tips and check-ins from women in your phase.</p>
            <span className={styles.carCta}>Open community <ArrowRight size={14} /></span>
          </Link>
          <Link href="/log/mood" className={`${styles.car} ${styles.carLearn}`} key="mood">
            <span className={styles.carIcon}><Moon size={22} /></span>
            <h3 className={styles.carTitle}>Daily check-in</h3>
            <p className={styles.carSub}>Log your mood, energy and symptoms.</p>
            <span className={styles.carCta}>Check in <ArrowRight size={14} /></span>
          </Link>
        </FocusCarousel>
      </main>
    );
  }

  // ---- STATE 2: assessed, on care plan → carousel dashboard ----
  const tasks = resolveDailyPlan(persona, fh.day);
  const winOf = (t: (typeof tasks)[number]) => WINDOW_FOR_CAT[t.category];
  const orderedTasks = [...tasks].sort((a, b) => WINDOW_ORDER.indexOf(winOf(a)) - WINDOW_ORDER.indexOf(winOf(b)));
  const doneCount = tasks.filter((t) => fh.isDone(t.id)).length;
  const taskOffset = setupCard ? 1 : 0; // index of the first task card in the carousel
  const barIdx = Math.max(0, Math.min(orderedTasks.length - 1, active - taskOffset));

  return (
    <main className={`${styles.home} fhTheme`}>
      {backHabit}
      <header className={styles.dashTop}>
        <div className={styles.wordmark}>For Her <span className={styles.tag}>PMOS</span></div>
        {fh.streak > 0 && <span className={styles.streak}><Flame size={13} /> {fh.streak}-day streak</span>}
      </header>

      <section className={styles.dashHero}>
        <p className={styles.hi}>Hi {persona.shortName}</p>
        <p className={styles.dayline}>Day {fh.day} of 90 · {doneCount}/{tasks.length} done today</p>
      </section>

      {/* Time bar — slide through your day and the task cards move with it */}
      <div className={styles.simBar}>
        <span className={styles.simCap}>Your day · slide to move through it</span>
        <input
          className={styles.simRange} type="range" min={0} max={Math.max(0, orderedTasks.length - 1)} step={1}
          value={barIdx} onChange={(e) => setScrollTo({ idx: taskOffset + Number(e.target.value) })}
          aria-label="Time of day"
        />
        <div className={styles.simTicks}>
          {orderedTasks.map((t, i) => (
            <button key={t.id} type="button"
              className={`${styles.simTick} ${i === barIdx ? styles.simTickOn : ""}`}
              onClick={() => setScrollTo({ idx: taskOffset + i })}>
              <span className={styles.simTickWin}>{WINDOW_LABEL[winOf(t)]}</span>
              <span className={styles.simTickTime}>{WINDOW_TIME[winOf(t)]}</span>
            </button>
          ))}
        </div>
      </div>

      <FocusCarousel scrollTo={scrollTo} onActiveChange={setActive}>
        {setupCard}
        {orderedTasks.map((t) => (
          <div className={`${styles.car} ${styles.carTask}`} key={t.id}>
            <span className={styles.carEyebrow}>{WINDOW_LABEL[winOf(t)]} · {WINDOW_TIME[winOf(t)]}</span>
            <h3 className={styles.carTitle}>{t.title}</h3>
            <p className={styles.carSub}>{t.detail}</p>
            <button type="button"
              className={`${styles.carCheck} ${fh.isDone(t.id) ? styles.carCheckOn : ""}`}
              onClick={() => fh.toggleDone(t.id)}>
              {fh.isDone(t.id) ? <><Check size={15} /> Done</> : "Mark done"}
            </button>
          </div>
        ))}
        <Link href="/community" className={`${styles.car} ${styles.carCommunity}`} key="community">
          <span className={styles.carEyebrow}>From your community</span>
          <h3 className={styles.carTitle}>Women in your phase are sharing what helps</h3>
          <p className={styles.carSub}>Tips, pacing and check-ins from women like you.</p>
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
          <h3 className={styles.carTitle}>8,240 steps today</h3>
          <p className={styles.carSub}>From your Habit activity — ahead of your phase pace.</p>
        </div>
        <Link href="/learn" className={`${styles.car} ${styles.carLearn}`} key="learn">
          <span className={styles.carEyebrow}>Today&apos;s read</span>
          <h3 className={styles.carTitle}>Why your skin breaks out before your period</h3>
          <span className={styles.carCta}>Read · 2 min <ArrowRight size={14} /></span>
        </Link>
        <Link href="/progress" className={`${styles.car} ${styles.carMood}`} key="progress">
          <span className={styles.carIcon}><TrendingUp size={22} /></span>
          <h3 className={styles.carTitle}>Your progress</h3>
          <p className={styles.carSub}>Habits you&apos;re building + the markers that move.</p>
          <span className={styles.carCta}>See progress <ArrowRight size={14} /></span>
        </Link>
      </FocusCarousel>

      <Link href="/plan" className={styles.journeyLink}><Map size={15} /> See my 90-day journey</Link>
    </main>
  );
}
