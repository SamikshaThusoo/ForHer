"use client";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertTriangle, Ban, ArrowRightLeft, type LucideIcon } from "lucide-react";
import type { Verdict } from "@/types/food";
import styles from "./VerdictCard.module.css";

const TONE: Record<Verdict["forYou"], string> = {
  great: "great", ok: "ok", watch: "watch", avoid: "avoid",
};

const TONE_ICON: Record<Verdict["forYou"], LucideIcon> = {
  great: CheckCircle2,
  ok: Circle,
  watch: AlertTriangle,
  avoid: Ban,
};

const TONE_LABEL: Record<Verdict["forYou"], string> = {
  great: "GREAT FOR YOU",
  ok: "OK FOR YOU",
  watch: "WATCH THIS",
  avoid: "BETTER TO AVOID",
};

export function VerdictCard({ verdict, foodName }: { verdict: Verdict; foodName: string }) {
  const ToneIcon = TONE_ICON[verdict.forYou];
  return (
    <motion.section
      className={styles.card}
      data-tone={TONE[verdict.forYou]}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className={styles.toneBand}>
        <ToneIcon size={14} strokeWidth={2.25} />
        <span>{TONE_LABEL[verdict.forYou]}</span>
      </header>
      <div className={styles.cardBody}>
        <h3 className={styles.food}>{foodName}</h3>
        <p className={styles.reason}>{verdict.oneLineReason}</p>
        {verdict.swap && (
          <div className={styles.swap}>
            <div className={styles.swapHead}>
              <ArrowRightLeft size={12} strokeWidth={2.25} />
              <span>Try instead</span>
            </div>
            <p className={styles.swapText}>{verdict.swap.name}</p>
            <p className={styles.swapWhy}>{verdict.swap.reason}</p>
          </div>
        )}
        <p className={styles.detail}>{verdict.detail}</p>
      </div>
    </motion.section>
  );
}
