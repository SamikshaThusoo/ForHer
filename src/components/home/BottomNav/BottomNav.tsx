import { Gamepad2, User, Menu, Plus } from "lucide-react";
import styles from "./BottomNav.module.css";

/**
 * Sticky bottom nav. Four flat tabs (Home, Play, Profile, Menu) plus an
 * elevated blue-gradient "My Benefits" pill that visually lifts above the
 * row.
 */
export function BottomNav() {
  return (
    <nav className={styles.nav}>
      <div className={`${styles.t} ${styles.active}`}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>
        Home
      </div>
      <div className={styles.t}>
        <Gamepad2 size={22} strokeWidth={1.75} />
        Play
      </div>
      <div className={styles.t}>
        <User size={22} strokeWidth={1.75} />
        Profile
      </div>
      <div className={styles.t}>
        <Menu size={22} strokeWidth={1.75} />
        Menu
      </div>
      <div className={styles.ben}>
        <Plus size={15} strokeWidth={2.25} />
        My Benefits
      </div>
    </nav>
  );
}
