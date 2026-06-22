"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import styles from "./MessageBubble.module.css";

interface Props { role: "user" | "habit"; text: string; citation?: string; }
export function MessageBubble({ role, text, citation }: Props) {
  if (role === "user") {
    return (
      <motion.div
        className={styles.user}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className={styles.text}>{text}</p>
        {citation && <p className={styles.citation}>{citation}</p>}
      </motion.div>
    );
  }
  return (
    <motion.div
      className={styles.habitRow}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className={styles.avatar} aria-hidden>
        <Sparkles size={14} strokeWidth={1.9} />
      </span>
      <div className={styles.habit}>
        <p className={styles.brandLabel}>Habit</p>
        <p className={styles.text}>{text}</p>
        {citation && <p className={styles.citation}>{citation}</p>}
      </div>
    </motion.div>
  );
}
