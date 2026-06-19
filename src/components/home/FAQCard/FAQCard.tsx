import { HelpCircle, ChevronRight } from "lucide-react";
import styles from "./FAQCard.module.css";
export function FAQCard() {
  return (
    <section className={styles.card}>
      <div className={styles.icon}>
        <HelpCircle size={18} strokeWidth={1.75} color="var(--color-brand)" />
      </div>
      <div>
        <p className={styles.title}>Frequently Asked Questions</p>
        <p className={styles.sub}>Here are our most commonly asked questions.</p>
      </div>
      <span className={styles.arrow}><ChevronRight size={20} strokeWidth={1.75} /></span>
    </section>
  );
}
