import { Sparkles } from "lucide-react";
import styles from "./EngageBanner.module.css";
export function EngageBanner() {
  return (
    <section className={styles.banner}>
      <div>
        <h3 className={styles.title}>Engage yourself for a healthier you</h3>
        <p className={styles.sub}>Take charge of your wellness journey.</p>
      </div>
      <div className={styles.illustration}>
        <Sparkles size={40} strokeWidth={1.75} color="rgba(255,255,255,0.9)" />
      </div>
    </section>
  );
}
