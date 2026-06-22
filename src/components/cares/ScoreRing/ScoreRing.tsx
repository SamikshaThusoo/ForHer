"use client";
import { motion } from "framer-motion";
import styles from "./ScoreRing.module.css";
import { bandFor, colorVarFor } from "@/lib/scoring";

interface Props {
  score: number;
  max?: number;
  size?: number;
  thickness?: number;
  /** When true, score number is rendered inside the ring (legacy behaviour). */
  showInnerNumber?: boolean;
}

export function ScoreRing({
  score,
  max = 1000,
  size = 88,
  thickness = 8,
  showInnerNumber = true,
}: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, score / max));
  const dash = circumference * pct;
  const colorVar = colorVarFor(score);
  const band = bandFor(score);

  return (
    <div className={styles.ring} style={{ width: size, height: size }} data-band={band}>
      <svg width={size} height={size} className={styles.svg}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E6EAF0"
          strokeWidth={thickness}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`var(${colorVar})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {showInnerNumber && (
        <div className={styles.center}>
          <span className={styles.score} style={{ color: `var(${colorVar})` }}>{score}</span>
          <span className={styles.max}>/ {max}</span>
        </div>
      )}
    </div>
  );
}
