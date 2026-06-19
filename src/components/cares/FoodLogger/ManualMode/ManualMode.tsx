"use client";
import { useState, useMemo } from "react";
import { FOODS } from "@/data/foods";
import styles from "./ManualMode.module.css";

export function ManualMode({ onLog }: { onLog: (foodId: string) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(
    () => FOODS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())),
    [q]
  );
  return (
    <div className={styles.wrap}>
      <input
        type="search" placeholder="Search Indian foods..." value={q}
        onChange={(e) => setQ(e.target.value)} className={styles.input}
      />
      <ul className={styles.list}>
        {results.map((f) => (
          <li key={f.id}>
            <button className={styles.item} onClick={() => onLog(f.id)}>
              <span className={styles.emoji}>{f.imageHint ?? "🍽"}</span>
              <span className={styles.name}>{f.name}</span>
              <span className={styles.kcal}>{f.per100g.energyKcal} kcal · 100g</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
