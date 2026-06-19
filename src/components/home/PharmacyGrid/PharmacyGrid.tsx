"use client";
import {
  Pill, Leaf, FlaskConical, Activity, Droplet, Heart, Salad,
  Dumbbell, CloudRain, User, Bandage, LayoutGrid, type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import styles from "./PharmacyGrid.module.css";

const ITEMS: {
  icon: LucideIcon;
  label: string;
  badge?: string;
  primary?: boolean;
}[] = [
  { icon: Pill,         label: "Vitamins & Supplements" },
  { icon: Leaf,         label: "Ayurvedic Wellness" },
  { icon: FlaskConical, label: "Homeopathic Medicine" },
  { icon: Activity,     label: "Monitoring Devices", badge: "Must have" },
  { icon: Droplet,      label: "Skin Care", badge: "Popular" },
  { icon: Heart,        label: "Sexual Wellness" },
  { icon: Salad,        label: "Food & Nutrition", badge: "Popular" },
  { icon: Dumbbell,     label: "Fitness & Health" },
  { icon: CloudRain,    label: "Monsoon Essentials" },
  { icon: User,         label: "Men Care" },
  { icon: Bandage,      label: "Pain Relief" },
  { icon: LayoutGrid,   label: "More", primary: true },
];

export function PharmacyGrid() {
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>Pharmacy Category</h3>
      <div className={styles.grid}>
        {ITEMS.map((it) => (
          <motion.button
            type="button"
            key={it.label}
            className={styles.card}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
          >
            {it.badge && <span className={styles.badge}>{it.badge}</span>}
            <span className={styles.iconWrap}>
              <it.icon size={20} strokeWidth={1.75} color="var(--color-brand)" />
            </span>
            <div className={it.primary ? styles.primary : styles.label}>
              {it.label}
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
