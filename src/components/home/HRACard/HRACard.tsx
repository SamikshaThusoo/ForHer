import { ClipboardCheck, ArrowRight } from "lucide-react";
import styles from "./HRACard.module.css";

export function HRACard() {
  return (
    <section className={styles.card}>
      <div className={styles.icon}>
        <ClipboardCheck size={18} strokeWidth={1.75} color="#ffffff" />
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>Complete your Health Risk Assessment</h3>
        <p className={styles.sub}>Get personalised health insights and recommendations based on your profile.</p>
        <button className={styles.cta}>Start Now <ArrowRight size={16} strokeWidth={2} /></button>
      </div>
    </section>
  );
}
