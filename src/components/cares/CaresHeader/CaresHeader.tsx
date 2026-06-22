"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./CaresHeader.module.css";

export function CaresHeader(_props: { title?: string } = {}) {
  return (
    <header className={styles.header}>
      <Link href="/" aria-label="Back" className={styles.back}>
        <ArrowLeft size={20} strokeWidth={2} />
      </Link>
      <div className={styles.wordmark} aria-label="For Her PMOS" style={{ fontFamily: "var(--font-forher-serif), Georgia, serif", color: "#5B2A4A" }}>
        For Her <span style={{ fontFamily: "var(--font-forher-sans), system-ui, sans-serif", fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8E5378", background: "rgba(142,83,120,0.12)", borderRadius: "999px", padding: "2px 7px", verticalAlign: "middle" }}>PMOS</span>
      </div>
      <span className={styles.spacer} />
    </header>
  );
}
