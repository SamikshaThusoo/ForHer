"use client";
import { motion } from "framer-motion";

interface Props { size: number; }

/**
 * Abstract, gender-neutral human silhouette: head + shoulders/torso.
 * Filled with a vertical brand-tint→brand-soft gradient. No facial features.
 * Animated with a slow breathing scale via Framer Motion.
 */
export function Silhouette({ size }: Props) {
  const id = "silhouette-grad";
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      animate={{ scale: [1, 1.02, 1] }}
      transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF1FB" />
          <stop offset="100%" stopColor="#CFE0F6" />
        </linearGradient>
      </defs>
      {/* Head */}
      <circle cx="50" cy="34" r="18" fill={`url(#${id})`} />
      {/* Shoulders/torso — a rounded trapezoid sitting below the head */}
      <path
        d="M 22 92
           C 22 70, 32 56, 50 56
           C 68 56, 78 70, 78 92
           Z"
        fill={`url(#${id})`}
      />
    </motion.svg>
  );
}
