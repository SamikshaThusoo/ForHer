import { Activity } from "lucide-react";
import styles from "./ProgramBadge.module.css";

export function ProgramBadge({ program, week, total = 12 }: { program: string; week: number; total?: number }) {
  return (
    <div className={styles.badge}>
      <Activity size={13} strokeWidth={2} className={styles.icon} />
      <span className={styles.text}>
        {program} <span className={styles.dot}>·</span> Week {week} of {total}
      </span>
    </div>
  );
}
