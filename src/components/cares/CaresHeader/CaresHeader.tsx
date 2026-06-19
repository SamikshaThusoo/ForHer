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
      <div className={styles.wordmark} aria-label="Habit Cares">
        <span className={styles.blue}>Habit</span>{" "}
        <span className={styles.orange}>Cares</span>
      </div>
      <span className={styles.spacer} />
    </header>
  );
}
