"use client";
import { FileText, Calendar, LineChart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./QuickActions.module.css";

interface ActionCard {
  icon: LucideIcon;
  title: string;
  sub: string;
}

const CARDS: ActionCard[] = [
  { icon: FileText,  title: "Records",  sub: "Health data" },
  { icon: Calendar,  title: "Bookings", sub: "Past & upcoming" },
  { icon: LineChart, title: "Reports",  sub: "Smart insights" },
];

/**
 * Three quick-nav cards. Clean unified white cards with a small icon chip
 * — no redundant arrow icon, no alternating tone gimmick.
 */
export function QuickActions() {
  return (
    <div className={styles.qa}>
      {CARDS.map((c) => {
        const Icon = c.icon;
        return (
          <button key={c.title} className={styles.qcard}>
            <span className={styles.ic}>
              <Icon size={20} strokeWidth={1.75} />
            </span>
            <div className={styles.body}>
              <div className={styles.t}>{c.title}</div>
              <div className={styles.s}>{c.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
