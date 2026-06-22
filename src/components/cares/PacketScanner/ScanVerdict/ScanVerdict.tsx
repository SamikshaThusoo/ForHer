"use client";
import { motion } from "framer-motion";
import { Package, CheckCircle2, Circle, AlertTriangle, Ban, type LucideIcon } from "lucide-react";
import type { PacketScan } from "@/data/packetScans";
import type { Verdict } from "@/types/food";
import styles from "./ScanVerdict.module.css";

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
  great: "GREAT CHOICE",
  ok: "OK IN MODERATION",
  watch: "EAT SPARINGLY",
  avoid: "BETTER TO AVOID",
};
const FOR_YOU_TEXT: Record<Verdict["forYou"], string> = {
  great: "Great choice",
  ok: "OK in moderation",
  watch: "Eat sparingly",
  avoid: "Better to avoid",
};

export function ScanVerdict({ packet, verdict }: { packet: PacketScan; verdict: Verdict }) {
  const ToneIcon = TONE_ICON[verdict.forYou];
  return (
    <motion.section
      className={styles.card}
      data-tone={TONE[verdict.forYou]}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className={styles.toneBand}>
        <ToneIcon size={14} strokeWidth={2.25} />
        <span>{TONE_LABEL[verdict.forYou]}</span>
      </header>
      <div className={styles.cardBody}>
        <div className={styles.head}>
          <span className={styles.iconChip}>
            <Package size={24} strokeWidth={1.75} />
          </span>
          <div>
            <p className={styles.brand}>{packet.brand}</p>
            <p className={styles.name}>{packet.name}</p>
          </div>
        </div>
        <div className={styles.reasons}>
          <p className={styles.reasonLine}>
            <b>For you</b> — {FOR_YOU_TEXT[verdict.forYou]}
          </p>
          <p className={styles.reasonLine}>
            <b>Why</b> — {verdict.oneLineReason}
          </p>
          {packet.altSuggestion && (
            <p className={styles.reasonLine}>
              <b>Better choice</b> — {packet.altSuggestion.brand} {packet.altSuggestion.name}{" "}
              <em>({packet.altSuggestion.whyBetter})</em>
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
