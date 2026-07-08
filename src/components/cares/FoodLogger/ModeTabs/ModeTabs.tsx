"use client";
import { motion } from "framer-motion";
import { Camera, PenLine, Mic, Search, type LucideIcon } from "lucide-react";
import styles from "./ModeTabs.module.css";
import type { LogMode } from "@/types/food";

const MODES: { id: LogMode; label: string; icon: LucideIcon }[] = [
  { id: "photo",   label: "Photo",   icon: Camera },
  { id: "write",   label: "Write",   icon: PenLine },
  { id: "voice",   label: "Voice",   icon: Mic },
  { id: "manual",  label: "Search",  icon: Search },
];

export function ModeTabs({ value, onChange }: { value: LogMode; onChange: (m: LogMode) => void }) {
  return (
    <div className={styles.tabs} role="tablist">
      {MODES.map((m) => {
        const isActive = m.id === value;
        return (
          <motion.button
            key={m.id}
            role="tab"
            aria-selected={isActive}
            className={isActive ? styles.active : styles.tab}
            onClick={() => onChange(m.id)}
            whileTap={{ scale: 0.96 }}
          >
            <span className={styles.icon}>
              <m.icon size={16} strokeWidth={isActive ? 2.25 : 1.75} />
            </span>
            <span className={styles.label}>{m.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
