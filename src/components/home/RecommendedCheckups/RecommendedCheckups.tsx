"use client";
import { motion } from "framer-motion";
import styles from "./RecommendedCheckups.module.css";

const GROUPS = [
  {
    label: "Men",
    age: "18–45 Yrs",
    photo:
      "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=300&q=80&auto=format&fit=crop",
  },
  {
    label: "Women",
    age: "18–45 Yrs",
    photo:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80&auto=format&fit=crop",
  },
  {
    label: "Sr. Men",
    age: ">45 Yrs",
    photo:
      "https://images.unsplash.com/photo-1559963110-71b394e7494d?w=300&q=80&auto=format&fit=crop",
  },
  {
    label: "Sr. Women",
    age: ">45 Yrs",
    photo:
      "https://images.unsplash.com/photo-1535637603896-07c179d71f96?w=300&q=80&auto=format&fit=crop",
  },
];

export function RecommendedCheckups() {
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>Recommended Checkups</h3>
      <div className={styles.grid}>
        {GROUPS.map((g) => (
          <motion.button
            type="button"
            key={g.label}
            className={styles.card}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={g.photo}
              alt={`${g.label} ${g.age}`}
              className={styles.photo}
              loading="lazy"
              decoding="async"
            />
            <div className={styles.scrim} />
            <div className={styles.captions}>
              <span className={styles.label}>{g.label}</span>
              <span className={styles.age}>{g.age}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
