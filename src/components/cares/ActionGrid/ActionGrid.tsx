import Link from "next/link";
import { Salad, ScanLine, MessageCircle, Stethoscope, ArrowRight, type LucideIcon } from "lucide-react";
import styles from "./ActionGrid.module.css";

const ACTIONS: {
  href: string;
  icon: LucideIcon;
  label: string;
  tone: "food" | "scan" | "ask" | "doc";
}[] = [
  { href: "/cares/food",      icon: Salad,         label: "Log food",       tone: "food" },
  { href: "/cares/scan",      icon: ScanLine,      label: "Scan a packet",  tone: "scan" },
  { href: "/cares/ask",       icon: MessageCircle, label: "Ask Habit",      tone: "ask"  },
  { href: "/cares/care-team", icon: Stethoscope,   label: "Doctor & coach", tone: "doc"  },
];

export function ActionGrid() {
  return (
    <section className={styles.grid}>
      {ACTIONS.map((a) => (
        <Link key={a.label} href={a.href} className={styles.card}>
          <span className={styles.chip} data-tone={a.tone}>
            <a.icon size={22} strokeWidth={1.8} />
          </span>
          <span className={styles.label}>{a.label}</span>
          <span className={styles.arrow}>
            <ArrowRight size={14} strokeWidth={2} />
          </span>
        </Link>
      ))}
    </section>
  );
}
