"use client";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import styles from "./ChatThread.module.css";

export function ChatThread({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className={styles.thread}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
