import { TestTube, ChevronRight } from "lucide-react";
import styles from "./RetestCountdown.module.css";
export function RetestCountdown({ days }: { days: number }) {
  return (
    <section className={styles.card}>
      <div className={styles.left}>
        <p className={styles.label}>
          <TestTube size={12} strokeWidth={2} />
          <span>Mid-program retest</span>
        </p>
        <p className={styles.detail}>HbA1c · BP · lipid panel</p>
      </div>
      <div className={styles.right}>
        <div className={styles.daysGroup}>
          <span className={styles.days}>{days}</span>
          <span className={styles.unit}>days</span>
        </div>
        <ChevronRight size={18} strokeWidth={2} className={styles.chev} />
      </div>
    </section>
  );
}
