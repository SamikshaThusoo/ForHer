"use client";
import { Children, useRef, useState, type ReactNode } from "react";
import styles from "./FocusCarousel.module.css";

/** A swipeable carousel where the centered card is sharp + full-size and the
 *  neighbours are blurred and scaled down (peeking at the edges). */
export function FocusCarousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const items = Children.toArray(children);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const node = c as HTMLElement;
      const cc = node.offsetLeft + node.offsetWidth / 2;
      const d = Math.abs(cc - center);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setActive(best);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.track} ref={ref} onScroll={onScroll}>
        {items.map((child, i) => (
          <div key={i} className={`${styles.slide} ${i === active ? styles.active : styles.inactive}`}>
            {child}
          </div>
        ))}
      </div>
      <div className={styles.dots}>
        {items.map((_, i) => <span key={i} className={`${styles.dot} ${i === active ? styles.dotOn : ""}`} />)}
      </div>
    </div>
  );
}
