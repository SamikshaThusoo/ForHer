import { ArrowRight } from "lucide-react";
import styles from "./RecommendedServices.module.css";
const ITEMS = [
  { tag: "Health check", title: "Explore our comprehensive family wellness package", cta: "Explore Now", bg: "#EAF6E8", tagBg: "#C9E5C2" },
  { tag: "Medicines Prescr", title: "Order your medicines prescribed by your doctor", cta: "Explore Now", bg: "#FBEDDC", tagBg: "#F3D2A6" },
];
export function RecommendedServices() {
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>Next Recommended Services</h3>
      <div className={styles.row}>
        {ITEMS.map((it) => (
          <div key={it.tag} className={styles.card} style={{ background: it.bg }}>
            <span className={styles.tag} style={{ background: it.tagBg }}>{it.tag}</span>
            <p className={styles.title}>{it.title}</p>
            <button className={styles.cta}>{it.cta} <ArrowRight size={14} strokeWidth={2} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
