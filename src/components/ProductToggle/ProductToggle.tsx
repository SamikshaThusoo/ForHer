import styles from "./ProductToggle.module.css";

/** Top-level switch between the two demo products. On the Habit Cares (Next) side
 *  this renders with `active="cares"`; the For Her static prototype shows its own
 *  matching pill that links back to "/". */
export function ProductToggle({ active }: { active: "cares" | "forher" }) {
  return (
    <div className={styles.toggle} role="tablist" aria-label="Switch product">
      <a className={`${styles.opt} ${active === "cares" ? styles.on : ""}`} href="/" role="tab" aria-selected={active === "cares"}>
        PCOS Program
      </a>
      <a className={`${styles.opt} ${active === "forher" ? styles.on : ""}`} href="/forher/index.html" role="tab" aria-selected={active === "forher"}>
        For Her
      </a>
    </div>
  );
}
