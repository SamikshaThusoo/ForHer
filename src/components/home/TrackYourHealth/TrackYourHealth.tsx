import { Activity, Heart, Droplet, Ruler, Moon, Sparkles, ArrowRight, type LucideIcon } from "lucide-react";
import styles from "./TrackYourHealth.module.css";

const TILES: { icon: LucideIcon; value: string; unit: string; label: string }[] = [
  { icon: Activity, value: "120",  unit: "mmHg",  label: "Blood Pressure" },
  { icon: Heart,    value: "70",   unit: "bpm",   label: "Heart Rate" },
  { icon: Droplet,  value: "98",   unit: "mg/dL", label: "Blood Sugar" },
  { icon: Ruler,    value: "22.4", unit: "kg/m²", label: "BMI" },
  { icon: Moon,     value: "7.2",  unit: "hr",    label: "Sleep" },
  { icon: Sparkles, value: "20",   unit: "min",   label: "Yoga" },
];

export function TrackYourHealth() {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h3 className={styles.heading}>Track your Health</h3>
        <button className={styles.viewAll}>View all <ArrowRight size={14} strokeWidth={2} /></button>
      </div>
      <div className={styles.grid}>
        {TILES.map((t) => (
          <div key={t.label} className={styles.tile}>
            <div className={styles.emoji}>
              <t.icon size={18} strokeWidth={1.75} color="var(--color-brand)" />
            </div>
            <div className={styles.value}>{t.value} <span className={styles.unit}>{t.unit}</span></div>
            <div className={styles.label}>{t.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
