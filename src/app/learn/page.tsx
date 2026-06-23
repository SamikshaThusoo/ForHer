"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { BottomNav } from "@/components/forher/BottomNav/BottomNav";
import styles from "./learn.module.css";

// PCOS/PMOS micro-learning, grounded in the 2023 International Evidence-based
// Guideline for the Assessment and Management of PCOS.
const CARDS: { tag: string; title: string; body: string }[] = [
  {
    tag: "Why it matters",
    title: "PMOS and insulin",
    body: "Many people with PMOS are more sensitive to insulin spikes. Steadier blood sugar — from balanced meals and regular movement — eases symptoms over time, even before any weight change.",
  },
  {
    tag: "Movement",
    title: "Move your way",
    body: "Aim for 150–300 minutes of moderate activity a week, plus muscle-strengthening on 2 days. No single type is better — the best exercise is the one you'll keep doing. Breaking up long sitting helps too.",
  },
  {
    tag: "Food",
    title: "Eat for steady energy",
    body: "There's no one PMOS diet. Build plates around protein and fibre, swap refined carbs for low-GI options (millet over white rice), and treat food as additions, not restrictions.",
  },
  {
    tag: "Your cycle",
    title: "Working with your phases",
    body: "Energy often climbs in the follicular and ovulatory phases (great for harder sessions) and dips in the luteal phase (lean into gentler movement, magnesium-rich foods and sleep). With PMOS, cycles can be irregular — logging helps you learn yours.",
  },
  {
    tag: "Mind",
    title: "Mood is part of the picture",
    body: "PMOS can affect mood, anxiety and body image. This is common and treatable — if low mood lingers, that's a reason to talk to a professional, never something to push through alone.",
  },
  {
    tag: "Sleep",
    title: "Sleep is a lever",
    body: "Poor sleep worsens insulin resistance and cravings. A consistent wind-down and wake time does more for PMOS than most people expect.",
  },
];

export default function LearnPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/plan" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · PMOS</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Learn about <em>PMOS</em></h1>
        <p className={styles.lead}>Short, practical reads — built on the 2023 international PMOS (PCOS) guideline.</p>
      </div>

      <div className={styles.cards}>
        {CARDS.map((c, i) => {
          const isOpen = open === i;
          return (
            <button key={c.title} type="button"
              className={`${styles.card} ${isOpen ? styles.cardOpen : ""}`}
              onClick={() => setOpen(isOpen ? null : i)}>
              <span className={styles.tag}>{c.tag}</span>
              <span className={styles.cardTitle}>{c.title}<span className={styles.chev}>{isOpen ? "–" : "+"}</span></span>
              {isOpen && <span className={styles.body}>{c.body}</span>}
            </button>
          );
        })}
      </div>

      <p className={styles.disclaimer}>General education for wellbeing — not medical advice. Check with your clinician for anything health-related.</p>
      <BottomNav />
    </main>
  );
}
