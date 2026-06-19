"use client";
import { Bell, Wallet, ShoppingCart } from "lucide-react";
import { HabitHealthLogo } from "@/components/brand/HabitHealthLogo/HabitHealthLogo";
import styles from "./TopBar.module.css";

/**
 * Brand row — HABIT/HEALTH lockup on the left, HC green-circle mark + bell/wallet/cart
 * icons on the right. Mirrors the .brandrow markup in the reference HTML.
 */
export function TopBar() {
  return (
    <header className={styles.bar}>
      <HabitHealthLogo size="sm" variant="full" />
      <div className={styles.right}>
        <div className={styles.hc} aria-label="Habit Cares">HC</div>
        <button aria-label="Notifications" className={styles.iconBtn}>
          <Bell size={20} strokeWidth={1.75} />
        </button>
        <button aria-label="Wallet" className={styles.iconBtn}>
          <Wallet size={20} strokeWidth={1.75} />
        </button>
        <button aria-label="Cart" className={styles.iconBtn}>
          <ShoppingCart size={20} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
