"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import type { CyclePhase } from "@/types/journey";
import { avatarSvgUriFor } from "@/lib/avatar";
import { FocusCarousel } from "../FocusCarousel/FocusCarousel";
import { ArrowRight, CalendarHeart, Activity, MessagesSquare, Droplet, Briefcase, Check } from "lucide-react";
import styles from "@/app/home.module.css";

// Phase accent for the community card (rose / gold / teal / plum), mirroring /community.
const COMM_ACCENT: Record<CyclePhase, { main: string; soft: string }> = {
  menstrual: { main: "#C76B7A", soft: "rgba(199,107,122,0.12)" },
  follicular: { main: "#C9A24A", soft: "rgba(201,162,74,0.14)" },
  ovulatory: { main: "#2F7A7A", soft: "rgba(47,122,122,0.12)" },
  luteal: { main: "#8E5378", soft: "rgba(142,83,120,0.12)" },
};

// Phase-aware "work" prompt (the productivity nudge from the original For Her).
const WORK_PROMPT: Record<CyclePhase, string> = {
  menstrual: "Lighter load today — save deep work for later in your cycle.",
  follicular: "Energy's climbing — a great week to start big projects.",
  ovulatory: "Focus and confidence peak — book the important conversations.",
  luteal: "Wind things down — protect your focus from overload.",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function todayMood(): { feelings: string[] } | null {
  try {
    const arr = JSON.parse(localStorage.getItem("forher.moodlog.v1") || "[]");
    if (!Array.isArray(arr)) return null;
    const e = [...arr].reverse().find((x: { day?: string }) => x.day === todayISO()) as { feelings?: string[] } | undefined;
    return e ? { feelings: e.feelings ?? [] } : null;
  } catch {
    return null;
  }
}

/** No-risk companion carousel: one period→phase card (mood via its CTA), hormone
 *  rhythm, day-at-work, community. Mirrors the plan hub, minus the daily tasks. */
export function ForHerCompanionHub() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const router = useRouter();
  if (!fh.hydrated) return null;

  const lp = fh.cycleLog?.lastPeriod;
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const cycleDay = lp ? cycleDayFromLog(lp, L, new Date()) : null;
  const phase: CyclePhase | null = lp
    ? phaseForCycleDay(cycleDayFromLog(lp, L, new Date()), L, fh.cycleLog?.duration ?? 5)
    : null;
  const mood = todayMood();

  return (
    <FocusCarousel>
      {/* 1 · Period — setup if not tracking, else phase-aware (with mood CTA). */}
      {!lp ? (
        <Link href="/cycle" className={`${styles.car} ${styles.carCycle}`} key="setup">
          <span className={styles.carIcon}><Droplet size={22} /></span>
          <h3 className={styles.carTitle}>Set up your tracker</h3>
          <p className={styles.carSub}>Tell us why you&apos;re here so we can tailor your cards.</p>
          <span className={styles.carCta}>Set up now <ArrowRight size={14} /></span>
        </Link>
      ) : (
        <div
          className={`${styles.car} ${styles.carCycle}`}
          key="phase"
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={() => router.push("/cycle")}
          onKeyDown={(e) => { if (e.key === "Enter") router.push("/cycle"); }}
        >
          <span className={styles.carIcon}><CalendarHeart size={22} /></span>
          <span className={styles.carEyebrow}>Day {cycleDay} of {L}</span>
          <h3 className={styles.carTitle}>{phase ? `${PHASE_LABEL[phase]} phase` : "Your cycle"}</h3>
          <p className={styles.carSub}>Calendar, phase and next-period prediction.</p>
          {mood ? (
            <span className={styles.carCta}>
              <Check size={14} /> {mood.feelings.length ? `Feeling ${mood.feelings.slice(0, 3).join(", ").toLowerCase()}` : "Mood logged"}
            </span>
          ) : (
            <button
              type="button"
              className={styles.carCta}
              onClick={(e) => { e.stopPropagation(); router.push("/log/mood"); }}
            >
              Log your mood <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* 2 · Hormone rhythm. */}
      <Link href="/hormones" className={`${styles.car} ${styles.carMood}`} key="hormones">
        <span className={styles.carIcon}><Activity size={22} /></span>
        <h3 className={styles.carTitle}>Hormone rhythm</h3>
        <p className={styles.carSub}>How your hormones move across your cycle.</p>
        <span className={styles.carCta}>Explore <ArrowRight size={14} /></span>
      </Link>

      {/* 3 · Your day at work. */}
      <Link href="/hormones" className={`${styles.car} ${styles.carLearn}`} key="work">
        <span className={styles.carIcon}><Briefcase size={22} /></span>
        <span className={styles.carEyebrow}>Your day at work</span>
        <h3 className={styles.carTitle}>{phase ? `${PHASE_LABEL[phase]} phase` : "Your cycle"}</h3>
        <p className={styles.carSub}>{phase ? WORK_PROMPT[phase] : "Log your cycle to get phase-based focus tips."}</p>
        <span className={styles.carCta}>See your hormones <ArrowRight size={14} /></span>
      </Link>

      {/* 4 · Community. */}
      <Link
        href="/community"
        className={`${styles.car} ${styles.carCommunity}`}
        key="community"
        style={{ background: `linear-gradient(150deg, ${COMM_ACCENT[phase ?? "luteal"].soft}, #fff 62%)` }}
      >
        <span className={styles.carIcon} style={{ background: COMM_ACCENT[phase ?? "luteal"].soft, color: COMM_ACCENT[phase ?? "luteal"].main }}><MessagesSquare size={22} /></span>
        <h3 className={styles.carTitle}>Community</h3>
        <p className={styles.carSub}>Tips and check-ins from women like you.</p>
        <div className={`${styles.carAvatars} fhReveal`}>
          {[0, 1, 2].map((n) => (
            <img key={n} className={styles.carAv} src={avatarSvgUriFor(`comm-${phase ?? "x"}-${n}`, "flat")} alt="" aria-hidden />
          ))}
          <span className={styles.carAvatarsLabel} style={{ color: COMM_ACCENT[phase ?? "luteal"].main }}>women like you</span>
        </div>
        <span className={styles.carCta} style={{ color: COMM_ACCENT[phase ?? "luteal"].main }}>Open community <ArrowRight size={14} /></span>
      </Link>
    </FocusCarousel>
  );
}
