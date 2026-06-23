"use client";
import { useRouter } from "next/navigation";
import type { JourneyTask } from "@/types/journey";
import { CAT_LABEL, fmtTarget, hrefForTask } from "@/lib/forher/taskmeta";
import { Check } from "lucide-react";
import styles from "./TaskCard.module.css";

/** A single daily task: checkbox toggles completion; tapping the body opens the
 *  relevant logging surface. Shared by the home "3 things" and the plan. */
export function TaskCard({
  task, done, onToggle, highlight,
}: {
  task: JourneyTask;
  done: boolean;
  onToggle: () => void;
  highlight?: boolean;
}) {
  const router = useRouter();
  const target = fmtTarget(task.target);
  const href = hrefForTask(task);

  return (
    <div className={`${styles.card} ${done ? styles.cardDone : ""} ${highlight ? styles.cardHi : ""}`}>
      <button
        type="button"
        className={`${styles.check} ${done ? styles.checkOn : ""}`}
        onClick={onToggle}
        aria-label={done ? "Mark not done" : "Mark done"}
      >
        {done && <Check size={14} strokeWidth={3} />}
      </button>
      <button
        type="button"
        className={styles.body}
        onClick={() => (href ? router.push(href) : onToggle())}
      >
        <span className={styles.title}>
          {task.title}
          {target && <span className={styles.target}>{target}</span>}
          {href && <span className={styles.go}>Log ›</span>}
        </span>
        <span className={styles.detail}>{task.detail}</span>
      </button>
      <span className={`${styles.cat} ${styles["cat_" + task.category]}`}>{CAT_LABEL[task.category]}</span>
    </div>
  );
}
