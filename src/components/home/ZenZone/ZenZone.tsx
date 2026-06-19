"use client";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import styles from "./ZenZone.module.css";

const VIDS = [
  {
    title: "Breathe & Flow: Breath work Exercises for Rela...",
    date: "Feb 11, 2025 | 12:23 PM",
    duration: "4 min",
    photo:
      "https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80&auto=format&fit=crop",
  },
  {
    title: "Calm Pulse: 5-min Box Breathing",
    date: "Feb 11, 2025 | 12:23 PM",
    duration: "5 min",
    photo:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80&auto=format&fit=crop",
  },
];

export function ZenZone() {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h3 className={styles.heading}>The Zen Zone</h3>
        <button className={styles.viewAll}>
          View all <ArrowRight size={14} strokeWidth={2} />
        </button>
      </div>
      <div className={styles.row}>
        {VIDS.map((v, i) => (
          <motion.article
            key={i}
            className={styles.card}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
          >
            <div className={styles.thumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.photo}
                alt={v.title}
                className={styles.thumbImg}
                loading="lazy"
                decoding="async"
              />
              <div className={styles.thumbScrim} />
              <span className={styles.duration}>{v.duration}</span>
              <span className={styles.playBtn} aria-hidden>
                <Play size={20} strokeWidth={2} fill="#0E5A57" color="#0E5A57" />
              </span>
            </div>
            <p className={styles.title}>{v.title}</p>
            <p className={styles.date}>{v.date}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
