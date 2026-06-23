"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./ScheduleCollection.module.css";

// A light timing questionnaire so the plan can land tasks at sensible moments.
const QUESTIONS = [
  { key: "wake", q: "When do you usually wake up?", opts: ["Before 6", "6–7", "7–8", "After 8"] },
  { key: "meals", q: "When's your biggest meal?", opts: ["Breakfast", "Lunch", "Dinner", "It varies"] },
  { key: "exercise", q: "When can you move most days?", opts: ["Morning", "Afternoon", "Evening", "Not sure yet"] },
  { key: "bed", q: "When do you usually sleep?", opts: ["Before 10", "10–11", "11–12", "After 12"] },
];

export function ScheduleCollection({ onComplete }: { onComplete: (s: Record<string, string>) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const allAnswered = QUESTIONS.every((q) => answers[q.key]);

  return (
    <div className={styles.wrap}>
      <span className={styles.eyebrow}>Last step</span>
      <h2 className={styles.title}>Let&apos;s fit the plan to <em>your day</em></h2>
      <p className={styles.lead}>So reminders land when they actually help — you can change these any time.</p>

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

      <button type="button" className={styles.cta} disabled={!allAnswered} onClick={() => onComplete(answers)}>
        Set my schedule <ArrowRight size={16} />
      </button>
    </div>
  );
}
