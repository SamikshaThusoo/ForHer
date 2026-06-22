import Link from "next/link";
import { CalendarClock, LineChart, WalletCards, type LucideIcon } from "lucide-react";
import styles from "./QuickLinks.module.css";

const LINKS: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: CalendarClock, label: "My Bookings",   href: "#" },
  { icon: LineChart,     label: "Smart Report",  href: "#" },
  { icon: WalletCards,   label: "Health Wallet", href: "#" },
];

export function QuickLinks() {
  return (
    <section className={styles.wrap}>
      <h3 className={styles.title}>Quick links</h3>
      <div className={styles.row}>
        {LINKS.map((l) => (
          <Link key={l.label} href={l.href} className={styles.card}>
            <span className={styles.icon}>
              <l.icon size={20} strokeWidth={1.75} color="var(--color-brand)" />
            </span>
            <span className={styles.label}>{l.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
