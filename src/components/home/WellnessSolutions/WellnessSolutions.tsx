"use client";
import { ReactNode } from "react";
import styles from "./WellnessSolutions.module.css";

interface Solution {
  label: string;
  icon: ReactNode;
  active?: boolean;
}

// Inline SVGs copied verbatim from the reference HTML to preserve visual identity.
const SOLUTIONS: Solution[] = [
  {
    label: "Lab Tests",
    active: true,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 3h6M10 3v6.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3" />
      </svg>
    ),
  },
  {
    label: "Consult",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 2v6a4 4 0 0 0 8 0V2" />
        <path d="M8 14a6 6 0 0 0 12 0v-2" />
        <circle cx={20} cy={10} r={2} />
      </svg>
    ),
  },
  {
    label: "Your Dost",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        <path d="M9 11h.01M13 11h.01" />
      </svg>
    ),
  },
  {
    label: "Gym",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6.5 6.5 17.5 17.5M21 21l-1-1M3 3l1 1" />
        <path d="m6 18-3-3 4-4M18 6l3 3-4 4" />
      </svg>
    ),
  },
  {
    label: "Pharmacy",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m10.5 20.5 10-10a5 5 0 0 0-7-7l-10 10a5 5 0 0 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    ),
  },
];

/**
 * "Range of wellness solutions" section — horizontal scroll of 5 tabs.
 * Lab Tests carries the active underline by default.
 */
export function WellnessSolutions() {
  return (
    <>
      <div className={styles.secH}>Range of wellness solutions</div>
      <div className={styles.wellrow}>
        {SOLUTIONS.map((s) => (
          <div key={s.label} className={`${styles.well} ${s.active ? styles.active : ""}`}>
            <div className={styles.ic}>{s.icon}</div>
            <div className={styles.l}>{s.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}
