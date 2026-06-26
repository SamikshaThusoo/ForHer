"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan, personaTrack } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay } from "@/lib/forher/cycleview";
import { ForHerEntryCard } from "@/components/forher/ForHerEntryCard/ForHerEntryCard";
import { ForHerHub } from "@/components/forher/ForHerHub/ForHerHub";
import { FocusCarousel } from "@/components/forher/FocusCarousel/FocusCarousel";
import {
  Flame, Moon, CalendarHeart, Activity, MessagesSquare, ArrowRight, ChevronLeft, Map, Droplet,
} from "lucide-react";
import styles from "../home.module.css";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ForHerHome() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const track = personaTrack(persona);

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
  const cyclePhase = fh.cycleLog?.lastPeriod
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
  const doneCount = tasks.filter((t) => fh.isDone(t.id)).length;

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

      <ForHerHub />

      <Link href="/plan" className={styles.journeyLink}><Map size={15} /> See my 90-day journey</Link>
    </main>
  );
}
