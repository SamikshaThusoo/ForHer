"use client";
import { Coins, Trophy } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import styles from "./LeaderboardCard.module.css";

const PEERS = [
  { rank: 1, name: "Ankit Raj", initials: "AR", points: 5463 },
  { rank: 2, name: "Mohit Rai", initials: "MR", points: 1720 },
];

/**
 * Weekly steps leaderboard. The "You" row sits at rank 6 with a blue
 * highlighted avatar chip; peers carry a neutral grey chip.
 */
export function LeaderboardCard() {
  const { persona } = usePersona();
  const youInitial = persona.shortName[0];

  return (
    <section className={styles.lb}>
      <div className={`${styles.row} ${styles.me}`}>
        <span className={styles.rk}>6</span>
        <span className={styles.av}>{youInitial}</span>
        <span className={styles.nm}>You</span>
        <span className={styles.co}>
          <Coins size={14} fill="currentColor" /> 10,000
        </span>
      </div>
      {PEERS.map((p) => (
        <div key={p.rank} className={styles.row}>
          <span className={styles.rk}>{p.rank}</span>
          <span className={`${styles.av} ${styles.peer}`}>{p.initials}</span>
          <span className={styles.nm}>{p.name}</span>
          <span className={styles.co}>
            <Coins size={14} fill="currentColor" /> {p.points.toLocaleString("en-IN")}
          </span>
        </div>
      ))}
      <button className={styles.view}>
        <Trophy size={14} strokeWidth={2} /> View Leaderboard
      </button>
    </section>
  );
}
