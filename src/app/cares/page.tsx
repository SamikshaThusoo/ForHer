"use client";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { CartoonAvatar } from "@/components/home/HealthScoreCard/CartoonAvatar";
import { ProgramBadge } from "@/components/cares/ProgramBadge/ProgramBadge";
import { ThreeThingsTile } from "@/components/cares/ThreeThingsTile/ThreeThingsTile";
import { ActionGrid } from "@/components/cares/ActionGrid/ActionGrid";
import styles from "./caresHome.module.css";

export default function CaresHome() {
  const { persona } = usePersona();
  if (!persona.cares.enrolled) {
    return (
      <main className={styles.notEnrolled}>
        <p>
          Habit Cares is unlocked when your Smart Report flags an actionable risk. Your latest
          report is in the green zone — keep going.
        </p>
      </main>
    );
  }

  const score = persona.smartReport.healthScore;
  const bioAge = persona.smartReport.biologicalAge;
  const chronoAge = persona.smartReport.chronologicalAge;
  const delta = bioAge - chronoAge;

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        {/* Centerpiece — avatar inside a clean blue ring */}
        <div className={styles.avatarRing}>
          <svg className={styles.ringSvg} viewBox="0 0 200 200" aria-hidden>
            <circle cx="100" cy="100" r="92" fill="none" stroke="#EEF0F4" strokeWidth="2" />
            <motion.path
              d="M 180 146 A 92 92 0 1 1 146 20"
              fill="none"
              stroke="#2060B0"
              strokeWidth="10"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />
          </svg>
          <div className={styles.avatarInner}>
            <CartoonAvatar />
          </div>
        </div>

        {/* Score readout — below the avatar, not overlaid */}
        <div className={styles.scoreBlock}>
          <span className={styles.scoreBig}>{score}</span>
          <span className={styles.scoreDenom}>/1000</span>
        </div>
        <div className={styles.scoreLabel}>Health Score · Fair</div>

        {/* Biological age strip */}
        <div className={styles.ageStrip}>
          <span className={styles.ageItem}>
            <span className={styles.ageNum}>{chronoAge}</span>
            <span className={styles.ageCap}>chronological</span>
          </span>
          <span className={styles.ageDivider} />
          <span className={styles.ageItem}>
            <span className={styles.ageNum}>{bioAge}</span>
            <span className={styles.ageCap}>biological</span>
          </span>
          {delta !== 0 && (
            <span className={delta > 0 ? styles.deltaUp : styles.deltaDown}>
              {delta > 0 ? `+${delta}` : delta} yrs
            </span>
          )}
        </div>

        {/* Program badge */}
        <div className={styles.programRow}>
          <ProgramBadge program="Prediabetes Reversal" week={persona.cares.weekOfTwelve ?? 1} />
        </div>

        {/* Why this plan */}
        <div className={styles.why}>
          <Info size={14} strokeWidth={2} className={styles.whyIcon} />
          <span>
            <span className={styles.whyLabel}>Why this plan:</span>{" "}
            {persona.smartReport.topDrivers.join(" · ")}
          </span>
        </div>
      </section>

      <ThreeThingsTile />
      <ActionGrid />
    </main>
  );
}
