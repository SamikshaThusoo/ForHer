"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan } from "@/lib/journey";
import { WINDOW_FOR_CAT, WINDOW_ORDER, WINDOW_LABEL, WINDOW_TIME } from "@/lib/forher/taskmeta";
import { FocusCarousel } from "../FocusCarousel/FocusCarousel";
import {
  ScanLine, Moon, ArrowRight, Check, Footprints, TrendingUp, Droplet, MessagesSquare,
} from "lucide-react";
import styles from "@/app/home.module.css";

/** The ever-changing For Her carousel + time bar. Shared by the /forher dashboard
 *  and the For Her card on the Habit home, so both stay identical. Care-plan only. */
export function ForHerHub() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const [active, setActive] = useState(0);
  const [scrollTo, setScrollTo] = useState<{ idx: number } | undefined>(undefined);
  if (!fh.hydrated) return null;

  const tasks = resolveDailyPlan(persona, fh.day);
  const winOf = (t: (typeof tasks)[number]) => WINDOW_FOR_CAT[t.category];
  const orderedTasks = [...tasks].sort((a, b) => WINDOW_ORDER.indexOf(winOf(a)) - WINDOW_ORDER.indexOf(winOf(b)));
  const setupShown = !fh.cycleLogged;
  const taskOffset = setupShown ? 1 : 0;
  const barIdx = Math.max(0, Math.min(orderedTasks.length - 1, active - taskOffset));

  return (
    <>
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
        {setupShown && (
          <Link href="/cycle" className={`${styles.car} ${styles.carCycle}`} key="setup">
            <span className={styles.carIcon}><Droplet size={22} /></span>
            <h3 className={styles.carTitle}>Set up your cycle</h3>
            <p className={styles.carSub}>Log your last period so we can predict your phases.</p>
            <span className={styles.carCta}>Set up now <ArrowRight size={14} /></span>
          </Link>
        )}
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
          <span className={styles.carIcon}><MessagesSquare size={22} /></span>
          <h3 className={styles.carTitle}>Women in your phase are sharing</h3>
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
        <Link href="/progress" className={`${styles.car} ${styles.carMood}`} key="progress">
          <span className={styles.carIcon}><TrendingUp size={22} /></span>
          <h3 className={styles.carTitle}>Your progress</h3>
          <p className={styles.carSub}>Habits you&apos;re building + the markers that move.</p>
          <span className={styles.carCta}>See progress <ArrowRight size={14} /></span>
        </Link>
      </FocusCarousel>
    </>
  );
}
