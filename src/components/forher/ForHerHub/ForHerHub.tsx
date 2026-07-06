"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { todaysMeals, type MealType } from "@/lib/forher/foodlog";
import { consultOnDay, isRetestDay, type ConsultInfo } from "@/lib/forher/consults";
import { getRating, setRating } from "@/lib/forher/consultfeedback";
import type { CyclePhase } from "@/types/journey";
import { fmtTarget } from "@/lib/forher/taskmeta";
import { FocusCarousel } from "../FocusCarousel/FocusCarousel";
import {
  ArrowRight, Check, Footprints, TrendingUp, Droplet, MessagesSquare, Stethoscope, FlaskConical,
  CalendarHeart, Briefcase, Utensils, Wind, Salad, Brain, Sun, HeartPulse, Star, Download, FileText, X,
} from "lucide-react";
import styles from "@/app/home.module.css";

const WORK_PROMPT: Record<CyclePhase, string> = {
  menstrual: "Keep the load light — save deep work for later.",
  follicular: "A great week to start big projects.",
  ovulatory: "Focus and confidence peak — book the big conversations.",
  luteal: "Wind things down — protect your focus.",
};
const BODY_NOTE: Record<CyclePhase, string> = {
  menstrual: "Lower energy and possible cramps — rest is productive.",
  follicular: "Energy, mood and focus are rising.",
  ovulatory: "Peak energy, libido and confidence.",
  luteal: "Energy dips; bloating and cravings may build.",
};
const SPECIALIST: Record<string, { label: string; Icon: React.ComponentType<{ size?: number }> }> = {
  doctor: { label: "doctor", Icon: Stethoscope },
  nutritionist: { label: "nutritionist", Icon: Salad },
  psychologist: { label: "psychologist", Icon: Brain },
  dermatology: { label: "dermatologist", Icon: Sun },
  gynae: { label: "gynaecologist", Icon: HeartPulse },
};
// What a "View details" popup shows for each consult / the test (prototype stand-in
// for the booked appointment in My Bookings).
const CONSULT_INCLUDES: Record<string, string[]> = {
  doctor: ["A review of your screening and AHC markers", "Your 90-day plan and any medication", "Time for questions about symptoms or side-effects"],
  nutritionist: ["A look at your food logs and blood-sugar patterns", "A meal plan tuned to your cycle", "Practical swaps for cravings and energy dips"],
  psychologist: ["A check-in on mood, stress and sleep", "Tools for the weeks PMOS hits hardest", "Support that works around your cycle"],
  dermatology: ["Skin and hair changes linked to PMOS", "A targeted skincare or treatment plan", "When and how to escalate"],
  gynae: ["A review of your cycle and hormonal markers", "Fertility or contraception questions", "Your next clinical steps"],
};
const TEST_INCLUDES = ["Fasting glucose and HbA1c", "A lipid panel", "Hormone panel (where needed)", "An outcomes review with your doctor"];

const pad = (n: number) => String(n).padStart(2, "0");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
function todayMood(): { feelings: string[]; cycle?: string } | null {
  try {
    const arr = JSON.parse(localStorage.getItem("forher.moodlog.v1") || "[]");
    if (!Array.isArray(arr)) return null;
    const e = [...arr].reverse().find((x: { day?: string }) => x.day === todayISO()) as
      { feelings?: string[]; cycle?: string } | undefined;
    return e ? { feelings: e.feelings ?? [], cycle: e.cycle } : null;
  } catch { return null; }
}

/** A mock "download" button that confirms in place — prescriptions, reports. */
function DownloadBtn({ label }: { label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={styles.cardBtn} onClick={() => setDone(true)}>
      {done ? <><Check size={14} /> Saved</> : <><Download size={14} /> {label}</>}
    </button>
  );
}

/** Post-consult card: rate the consult + grab the prescription. */
function ConsultDoneCard({ info }: { info: ConsultInfo }) {
  const sp = SPECIALIST[info.service] ?? { label: "care team", Icon: Stethoscope };
  const [rating, setRatingState] = useState(() => getRating(info.day, info.service));
  const rate = (n: number) => { setRatingState(n); setRating(info.day, info.service, n); };
  return (
    <div className={`${styles.car} ${styles.carClinical}`}>
      <span className={styles.carIcon}><sp.Icon size={22} /></span>
      <span className={styles.carEyebrow}>From your {sp.label}</span>
      <h3 className={styles.consultQ}>How was your consult?</h3>
      <div className={styles.stars} role="group" aria-label="Rate your consult">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={styles.star} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => rate(n)}>
            <Star size={20} fill={n <= rating ? "#F2C14E" : "none"} color={n <= rating ? "#F2C14E" : "#D6B9C6"} />
          </button>
        ))}
      </div>
      <DownloadBtn label="Download prescription" />
    </div>
  );
}

/** The ever-changing For Her carousel. Care-plan only. Swipe to move between cards. */
export function ForHerHub() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const router = useRouter();
  const [detail, setDetail] = useState<{ kind: "consult" | "test"; service?: string; title: string } | null>(null);
  if (!fh.hydrated) return null;

  const tasks = resolveDailyPlan(persona, fh.day);
  const stepsTask = tasks.find((t) => t.id === "steps");
  const stepGoal = stepsTask ? fmtTarget(stepsTask.target) : "10,000 steps";

  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const lp = fh.cycleLog?.lastPeriod;
  const cyclePhase: CyclePhase | null = lp ? phaseForCycleDay(cycleDayFromLog(lp, L, new Date()), L, fh.cycleLog?.duration ?? 5) : null;
  const cycleDay = lp ? cycleDayFromLog(lp, L, new Date()) : null;
  const mood = todayMood();
  const meals = todaysMeals();

  // Consult + test cards are tied to the exact selected care-plan day.
  const consult = consultOnDay(persona, fh.day);
  const isTestDay = isRetestDay(persona, fh.day);

  const mealCard = (m: MealType) => {
    const loggedName = meals[m];
    return (
      <Link href={`/cares/food?meal=${m}`} className={`${styles.car} ${styles.carScan}`} key={`meal-${m}`}>
        <span className={styles.carIcon}><Utensils size={22} /></span>
        <span className={styles.carEyebrow}>{cap(m)}</span>
        <h3 className={styles.carTitle}>{loggedName ?? `Log ${m}`}</h3>
        <p className={styles.carSub}>{loggedName ? "Logged today — tap to change." : "Scan, say or search what you ate."}</p>
        <span className={styles.carCta}>{loggedName ? <><Check size={14} /> Logged · update</> : <>Log food <ArrowRight size={14} /></>}</span>
      </Link>
    );
  };

  // ---- Explicit card order (per spec) ----
  const cards: React.ReactNode[] = [];

  // 1 · Period — setup if not tracking, else phase-aware (with mood CTA).
  if (!fh.cycleLogged) {
    cards.push(
      <Link href="/cycle" className={`${styles.car} ${styles.carCycle}`} key="period-setup">
        <span className={styles.carIcon}><Droplet size={22} /></span>
        <h3 className={styles.carTitle}>Set up your tracker</h3>
        <p className={styles.carSub}>Tell us why you&apos;re here so we can tailor your cards.</p>
        <span className={styles.carCta}>Set up now <ArrowRight size={14} /></span>
      </Link>,
    );
  } else if (cyclePhase && cycleDay) {
    cards.push(
      <div className={`${styles.car} ${styles.carCycle}`} key="period-phase"
        role="button" tabIndex={0} style={{ cursor: "pointer" }}
        onClick={() => router.push("/cycle")}
        onKeyDown={(e) => { if (e.key === "Enter") router.push("/cycle"); }}>
        <span className={styles.carIcon}><CalendarHeart size={22} /></span>
        <span className={styles.carEyebrow}>Day {cycleDay} of {L}</span>
        <h3 className={styles.carTitle}>{PHASE_LABEL[cyclePhase]} phase</h3>
        <p className={styles.carSub}>{BODY_NOTE[cyclePhase]}</p>
        {mood
          ? <span className={styles.carCta}><Check size={14} /> {mood.feelings.length ? `Feeling ${mood.feelings.slice(0, 3).join(", ").toLowerCase()}` : "Mood logged"}</span>
          : <button type="button" className={styles.carCta}
              onClick={(e) => { e.stopPropagation(); router.push("/log/mood"); }}>
              Log your mood <ArrowRight size={14} />
            </button>}
      </div>,
    );
  }

  // 2 · Consult day — both states together. "View details" opens a popup (will
  // deep-link to the booked appointment in My Bookings in the real app).
  if (consult) {
    const sp = SPECIALIST[consult.service] ?? { label: "care team", Icon: Stethoscope };
    const openConsult = () => setDetail({ kind: "consult", service: consult.service, title: consult.label });
    cards.push(
      <div className={`${styles.car} ${styles.carClinical}`} key="consult-up"
        role="button" tabIndex={0} style={{ cursor: "pointer" }}
        onClick={openConsult} onKeyDown={(e) => { if (e.key === "Enter") openConsult(); }}>
        <span className={styles.carIcon}><sp.Icon size={22} /></span>
        <span className={styles.carEyebrow}>From your care team</span>
        <h3 className={styles.carTitle}>You&apos;ve a consult today</h3>
        <p className={styles.carSub}>{consult.label}. Here&apos;s what to expect.</p>
        <span className={styles.carCta}>View details <ArrowRight size={14} /></span>
      </div>,
    );
    cards.push(<ConsultDoneCard info={consult} key={`consult-done-${consult.day}`} />);
  }

  // 2 · Test day — the reminder is the second card. "View details" opens a popup.
  if (isTestDay) {
    const openTest = () => setDetail({ kind: "test", title: "Day 90 retest" });
    cards.push(
      <div className={`${styles.car} ${styles.carClinical}`} key="test-reminder"
        role="button" tabIndex={0} style={{ cursor: "pointer" }}
        onClick={openTest} onKeyDown={(e) => { if (e.key === "Enter") openTest(); }}>
        <span className={styles.carIcon}><FlaskConical size={22} /></span>
        <span className={styles.carEyebrow}>This morning</span>
        <h3 className={styles.carTitle}>Time for your test</h3>
        <p className={styles.carSub}>Fasting bloods for your Day 90 retest. Water is fine.</p>
        <span className={styles.carCta}>View details <ArrowRight size={14} /></span>
      </div>,
    );
  }

  // 3 · Breakfast.
  cards.push(mealCard("breakfast"));

  // 4 · Step goal — minimal reminder.
  cards.push(
    <div className={`${styles.car} ${styles.carSteps}`} key="step-goal">
      <span className={styles.carIcon}><Footprints size={22} /></span>
      <span className={styles.carEyebrow}>Today&apos;s goal</span>
      <h3 className={styles.carTitle}>{stepGoal}</h3>
      <p className={styles.carSub}>Short walks after meals help steady your blood sugar.</p>
    </div>,
  );

  // 5 · Hormones · day at work.
  if (cyclePhase) {
    cards.push(
      <Link href="/hormones" className={`${styles.car} ${styles.carLearn}`} key="work">
        <span className={styles.carIcon}><Briefcase size={22} /></span>
        <span className={styles.carEyebrow}>Hormones at work</span>
        <h3 className={styles.carTitle}>{PHASE_LABEL[cyclePhase]} phase</h3>
        <p className={styles.carSub}>{WORK_PROMPT[cyclePhase]}</p>
        <span className={styles.carCta}>See your hormones <ArrowRight size={14} /></span>
      </Link>,
    );
  }

  // 6 · Lunch.
  cards.push(mealCard("lunch"));

  // 7 · Breathing.
  cards.push(
    <div className={`${styles.car} ${styles.carBreathe}`} key="breathe">
      <span className={styles.carIcon}><Wind size={22} /></span>
      <span className={styles.carEyebrow}>Reset</span>
      <h3 className={styles.carTitle}>Take a breathing break</h3>
      <p className={styles.carSub}>A minute of slow breathing to steady cortisol and calm your mind.</p>
    </div>,
  );

  // Report — before dinner, on test days only.
  if (isTestDay) {
    cards.push(
      <div className={`${styles.car} ${styles.carClinical}`} key="report">
        <span className={styles.carIcon}><FileText size={22} /></span>
        <span className={styles.carEyebrow}>Your results are in</span>
        <h3 className={styles.carTitle}>Download your report</h3>
        <p className={styles.carSub}>Your latest labs are ready to view and share.</p>
        <DownloadBtn label="Download report" />
      </div>,
    );
  }

  // 8 · Dinner.
  cards.push(mealCard("dinner"));

  // 9 · Step status (live-ish).
  cards.push(
    <div className={`${styles.car} ${styles.carSteps}`} key="step-status">
      <span className={styles.carIcon}><Footprints size={22} /></span>
      <span className={styles.carEyebrow}>End of day</span>
      <h3 className={styles.carTitle}>8,240 / 10,000 steps</h3>
      <p className={styles.carSub}>From your Habit activity — 82% of today&apos;s goal.</p>
    </div>,
  );

  // 10 · Community.
  cards.push(
    <Link href="/community" className={`${styles.car} ${styles.carCommunity}`} key="community">
      <span className={styles.carIcon}><MessagesSquare size={22} /></span>
      <h3 className={styles.carTitle}>Women in your phase are sharing</h3>
      <p className={styles.carSub}>Tips and check-ins from women like you.</p>
      <span className={styles.carCta}>Open community <ArrowRight size={14} /></span>
    </Link>,
  );

  // 11 · See today's progress.
  cards.push(
    <Link href="/progress" className={`${styles.car} ${styles.carMood}`} key="progress">
      <span className={styles.carIcon}><TrendingUp size={22} /></span>
      <h3 className={styles.carTitle}>See today&apos;s progress</h3>
      <p className={styles.carSub}>Habits you&apos;re building + the markers that move.</p>
      <span className={styles.carCta}>See progress <ArrowRight size={14} /></span>
    </Link>,
  );

  return (
    <>
      <FocusCarousel>{cards}</FocusCarousel>
      {detail && (
        <div className={styles.detailBg} onClick={() => setDetail(null)}>
          <div className={styles.detailCard} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.detailClose} onClick={() => setDetail(null)} aria-label="Close"><X size={16} /></button>
            <span className={styles.detailEyebrow}>
              {detail.kind === "test" ? "Your retest" : `Your ${SPECIALIST[detail.service ?? ""]?.label ?? "consult"}`}
            </span>
            <h3 className={styles.detailTitle}>{detail.title}</h3>
            <p className={styles.detailLead}>What&apos;s included</p>
            <ul className={styles.detailList}>
              {(detail.kind === "test" ? TEST_INCLUDES : CONSULT_INCLUDES[detail.service ?? ""] ?? []).map((it, i) => (
                <li key={i} className={styles.detailItem}><Check size={15} /> {it}</li>
              ))}
            </ul>
            <p className={styles.detailNote}>Book it and track it in your clinic.</p>
            <button type="button" className={styles.detailBtn} onClick={() => { setDetail(null); router.push("/clinic"); }}>Go to clinic <ArrowRight size={14} /></button>
          </div>
        </div>
      )}
    </>
  );
}
