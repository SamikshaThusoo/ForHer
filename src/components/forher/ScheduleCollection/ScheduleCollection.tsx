"use client";
import { useState } from "react";
import { ArrowRight, Bell, Check } from "lucide-react";
import styles from "./ScheduleCollection.module.css";

// Timing questions so the plan can land each daily prompt at a sensible moment.
const QUESTIONS = [
  { key: "wake", q: "When do you usually wake up?", opts: ["Before 6", "6–7", "7–8", "After 8"] },
  { key: "meals", q: "When's your biggest meal?", opts: ["Breakfast", "Lunch", "Dinner", "It varies"] },
  { key: "move", q: "When can you move most days?", opts: ["Morning", "Afternoon", "Evening", "Not sure yet"] },
  { key: "checkin", q: "Best time for a quick mood & symptom check-in?", opts: ["Morning", "Midday", "Evening", "Before bed"] },
  { key: "bed", q: "When do you usually wind down?", opts: ["Before 10", "10–11", "11–12", "After 12"] },
];

// The daily prompts she can opt into — these are exactly what the care plan nudges.
const NUDGES = [
  { key: "meals", label: "Meals & food scan" },
  { key: "movement", label: "Movement" },
  { key: "mood", label: "Mood & symptoms" },
  { key: "hydration", label: "Hydration" },
  { key: "winddown", label: "Wind-down & sleep" },
];

export function ScheduleCollection({ onComplete }: { onComplete: (s: Record<string, string>) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [nudges, setNudges] = useState<Set<string>>(() => new Set(NUDGES.map((n) => n.key)));
  const allAnswered = QUESTIONS.every((q) => answers[q.key]);

  const toggleNudge = (k: string) =>
    setNudges((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <div className={styles.wrap}>
      <span className={styles.eyebrow}>Last step</span>
      <h2 className={styles.title}>Let&apos;s fit the plan to <em>your day</em></h2>
      <p className={styles.lead}>So each nudge lands when it actually helps — you can change all of this any time.</p>

      {QUESTIONS.map((item) => (
        <div key={item.key} className={styles.q}>
          <p className={styles.qtext}>{item.q}</p>
          <div className={styles.opts}>
            {item.opts.map((o) => (
              <button
                key={o} type="button"
                className={`${styles.opt} ${answers[item.key] === o ? styles.optOn : ""}`}
                onClick={() => setAnswers((p) => ({ ...p, [item.key]: o }))}
              >{o}</button>
            ))}
          </div>
        </div>
      ))}

      <div className={styles.nudgeBlock}>
        <p className={styles.nudgeHead}><Bell size={14} /> Which daily nudges do you want?</p>
        <div className={styles.nudgeList}>
          {NUDGES.map((n) => {
            const on = nudges.has(n.key);
            return (
              <button key={n.key} type="button"
                className={`${styles.nudgeRow} ${on ? styles.nudgeRowOn : ""}`}
                onClick={() => toggleNudge(n.key)}>
                <span className={styles.nudgeRowLabel}>{n.label}</span>
                <span className={`${styles.nudgeCheck} ${on ? styles.nudgeCheckOn : ""}`}>{on && <Check size={13} strokeWidth={3} />}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" className={styles.cta} disabled={!allAnswered}
        onClick={() => onComplete({ ...answers, nudges: [...nudges].join(",") })}>
        Set my reminders <ArrowRight size={16} />
      </button>
    </div>
  );
}
