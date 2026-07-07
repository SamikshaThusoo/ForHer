"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { X, HeartPulse } from "lucide-react";
import type { Nudge } from "@/lib/forher/nudge";
import styles from "./ClinicNudge.module.css";

/** Dismissible, non-diagnostic nudge into the clinic. One shows at a time. */
export function ClinicNudge({ nudge, onDismiss }: { nudge: Nudge; onDismiss: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={styles.nudge}
      role="region"
      aria-label="Clinic suggestion"
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.25 }}
    >
      <span className={styles.icon}>
        <HeartPulse size={18} />
      </span>
      <div className={styles.body}>
        <strong className={styles.title}>{nudge.title}</strong>
        <p className={styles.text}>{nudge.body}</p>
        <Link href={nudge.href} className={styles.cta}>
          {nudge.cta} →
        </Link>
      </div>
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </motion.div>
  );
}
