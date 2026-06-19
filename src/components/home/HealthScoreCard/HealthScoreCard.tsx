"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate as motionAnimate } from "framer-motion";
import { Heart, TrendingUp, TrendingDown, Check, Moon, Info, Flame } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { Sparkline } from "./Sparkline";
import styles from "./HealthScoreCard.module.css";

/**
 * State A — small white card with a Health Score progress bar.
 * State B — compact "Journey spine" whole-card:
 *   eyebrow (program + streak) · hero score + trend · 12-week journey track ·
 *   today's action · coach line · CTA. One tight, glanceable card.
 */
export function HealthScoreCard() {
  const { persona } = usePersona();
  if (!persona.cares.enrolled) return <StateACard />;
  return <StateBHero />;
}

/* ---------- State A small card ---------- */
function StateACard() {
  return (
    <section className={styles.hs}>
      <div className={styles.hsTop}>
        <div className={styles.hsLbl}>
          <Heart size={16} fill="currentColor" />
          Your Health Score
        </div>
        <div className={styles.hsWord}>Good</div>
      </div>
      <div className={styles.hsBarrow}>
        <div className={styles.hsBar}><i /></div>
        <div className={styles.hsV}>
          720<small>/1000</small>
        </div>
      </div>
      <div className={styles.hsCap}>
        <TrendingUp size={13} strokeWidth={2} />
        You are healthier than 75% of people.
      </div>
    </section>
  );
}

/* ---------- 12-week journey model ---------- */
const TOTAL_WEEKS = 12;
const MILESTONES = [
  { week: 6, short: "Wk 6 retest" },
  { week: 12, short: "Graduation" },
] as const;

function journeyFor(week: number) {
  const pct = Math.max(0, Math.min(100, (week / TOTAL_WEEKS) * 100));
  const next = MILESTONES.find((m) => m.week > week) ?? MILESTONES[MILESTONES.length - 1];
  const weeksAway = Math.max(0, next.week - week);
  return { pct, next, weeksAway };
}

/* ---------- Today's action — inline tappable ---------- */
function TodayAction({ done2 = 2, total = 3 }: { done2?: number; total?: number }) {
  const [done, setDone] = useState(false);
  const count = done ? total : done2;
  return (
    <motion.button
      type="button"
      className={done ? styles.todayRowDone : styles.todayRow}
      onClick={() => setDone((d) => !d)}
      whileTap={{ scale: 0.99 }}
      aria-pressed={done}
      aria-label={done ? "Marked done: Sleep by 11:15 pm" : "Mark done: Sleep by 11:15 pm"}
    >
      <span className={styles.todayIcon}>
        <Moon size={16} strokeWidth={1.9} />
      </span>
      <span className={styles.todayBody}>
        <span className={styles.todayLabel}>
          TODAY · {count} OF {total}
          <span className={styles.todayDots}>
            {Array.from({ length: total }).map((_, i) => (
              <i key={i} className={i < count ? styles.on : undefined} />
            ))}
          </span>
        </span>
        <span className={styles.todayTitle}>Sleep by 11:15 pm</span>
      </span>
      <motion.span
        className={styles.todayBtn}
        animate={{ scale: done ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {done ? (<><Check size={13} strokeWidth={2.6} /> Done</>) : "Mark done"}
      </motion.span>
    </motion.button>
  );
}

/* ---------- State B hero (compact whole-card) ---------- */
function StateBHero() {
  const { persona } = usePersona();
  const target = persona.smartReport.healthScore;
  const history = persona.smartReport.scoreHistory ?? [target];
  const weekAgo = history[0] ?? target;
  const delta = target - weekAgo;
  const cause = persona.smartReport.scoreCauseToday;
  const [showCause, setShowCause] = useState(false);

  const week = persona.cares.weekOfTwelve ?? 1;
  const journey = journeyFor(week);

  const bioGain =
    typeof persona.smartReport.baselineBiologicalAge === "number"
      ? persona.smartReport.baselineBiologicalAge - persona.smartReport.biologicalAge
      : 0;

  const count = useMotionValue(Math.max(0, target - 8));
  const display = useTransform(count, (v) => Math.round(v).toString());
  useEffect(() => {
    const controls = motionAnimate(count, target, { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 });
    return controls.stop;
  }, [count, target]);

  const trendTone: "up" | "down" | "flat" = delta > 2 ? "up" : delta < -2 ? "down" : "flat";
  const coach = persona.cares.coachMessage;
  const coachPhoto = persona.cares.nextCoachSession?.photoUrl;

  return (
    <motion.section
      className={styles.hero}
      data-trend={trendTone}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28, mass: 1 }}
    >
      {/* Eyebrow: program + streak */}
      <div className={styles.eyebrow}>
        <span className={styles.eyebrowLabel}>Prediabetes Reversal</span>
        {persona.cares.streakDays != null && persona.cares.streakDays > 0 && (
          <span className={styles.streak} aria-label={`Day ${persona.cares.streakDays} streak`}>
            <Flame size={12} strokeWidth={2.2} fill="currentColor" />
            Day <b>{persona.cares.streakDays}</b>
          </span>
        )}
      </div>

      {/* Hero score + sparkline */}
      <div className={styles.scoreRow}>
        <motion.span className={styles.scoreBig}>{display}</motion.span>
        <span className={styles.scoreDenom}>/1000</span>
        {history.length >= 2 && (
          <Sparkline values={history} width={58} height={22} className={styles.spark} />
        )}
      </div>

      {/* Trend — tap to reveal cause */}
      <motion.button
        type="button"
        className={styles.trendRow}
        onClick={() => setShowCause((v) => !v)}
        aria-expanded={showCause}
        aria-label={`${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta)} versus last week. Tap for explanation.`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <span className={delta >= 0 ? styles.delta : styles.deltaDown}>
          {delta >= 0 ? <TrendingUp size={12} strokeWidth={2.4} /> : <TrendingDown size={12} strokeWidth={2.4} />}
          {`${delta >= 0 ? "+" : ""}${delta}`}
        </span>
        <span className={styles.vs}>
          vs last week{bioGain > 0.1 ? ` · Bio age ${bioGain.toFixed(1)} yrs younger` : ""}
        </span>
        {cause && <Info size={12} className={styles.trendInfo} strokeWidth={2.2} />}
      </motion.button>

      <AnimatePresence initial={false}>
        {showCause && cause && (
          <motion.div
            className={styles.causeReveal}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="region"
            aria-label="Why the score moved"
          >
            <Info size={14} strokeWidth={2.2} className={styles.causeIcon} />
            <span>{cause}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 12-week journey */}
      <div className={styles.journeyLabels}>
        <span className={styles.journeyWeek}>Week {week} of {TOTAL_WEEKS}</span>
        <span className={styles.journeyNext}>
          Next: {journey.next.short} · {journey.weeksAway} {journey.weeksAway === 1 ? "wk" : "wks"}
        </span>
      </div>
      <div className={styles.journeyTrack} aria-label={`Week ${week} of ${TOTAL_WEEKS}`}>
        <div className={styles.jRail} />
        <motion.div
          className={styles.jFill}
          initial={{ width: 0 }}
          animate={{ width: `${journey.pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
        />
        <span className={`${styles.jPip} ${styles.jPipStart}`} style={{ left: 2 }} />
        <span className={`${styles.jPip} ${styles.jPipMid}`} style={{ left: `${(6 / TOTAL_WEEKS) * 100}%` }} />
        <span className={`${styles.jPip} ${styles.jPipEnd}`} style={{ left: "calc(100% - 2px)" }} />
      </div>

      <div className={styles.hair} />

      {/* Today's action */}
      <TodayAction />

      {/* Coach line */}
      {coach && (
        <div className={styles.coachLine}>
          {coachPhoto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={coachPhoto} alt="" className={styles.coachAv} loading="lazy" decoding="async" />
          ) : (
            <span className={styles.coachAvFallback} aria-hidden>{coach.coach[0]}</span>
          )}
          <p className={styles.coachLineText}>
            <b>{coach.coach}</b> {coach.quote}
          </p>
        </div>
      )}

      {/* CTA */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Link href="/cares" className={styles.cta}>Open Habit Cares</Link>
      </motion.div>
    </motion.section>
  );
}
