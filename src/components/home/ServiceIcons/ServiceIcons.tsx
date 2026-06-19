import { FlaskConical, Stethoscope, Sparkles, Pill, Hospital, type LucideIcon } from "lucide-react";
import styles from "./ServiceIcons.module.css";

const SERVICES: { icon: LucideIcon; label: string }[] = [
  { icon: FlaskConical, label: "Lab Tests" },
  { icon: Stethoscope,  label: "Consultancy" },
  { icon: Sparkles,     label: "Wellness" },
  { icon: Pill,         label: "Medicines" },
  { icon: Hospital,     label: "Clinic Visit" },
];

export function ServiceIcons() {
  return (
    <nav className={styles.row} aria-label="Quick services">
      {SERVICES.map((s) => (
        <button key={s.label} className={styles.item}>
          <span className={styles.icon}>
            <s.icon size={20} strokeWidth={1.75} color="var(--color-brand)" />
          </span>
          <span className={styles.label}>{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
