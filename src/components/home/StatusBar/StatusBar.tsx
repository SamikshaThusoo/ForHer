import styles from "./StatusBar.module.css";

/**
 * Phone status bar — 9:41 clock on the left, signal/wifi/battery cluster
 * on the right. Mirrors the .status row in the reference HTML.
 */
export function StatusBar() {
  return (
    <div className={styles.status}>
      <span>9:41</span>
      <span className={styles.cluster}>
        <span>{"▮▮▮"}</span>
        <span>{"📶"}</span>
        <span>{"⏻"}</span>
      </span>
    </div>
  );
}
