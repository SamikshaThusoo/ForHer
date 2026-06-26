"use client";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./FocusCarousel.module.css";

/** A swipeable carousel where the centered card is sharp + full-size and the
 *  neighbours are blurred and scaled down (peeking on both sides).
 *  - `scrollTo` (a fresh object per request) scrolls programmatically to an index.
 *  - `onActiveChange` reports the centred index back (to sync an external bar). */
export function FocusCarousel({ children, scrollTo, onActiveChange }: {
  children: ReactNode;
  scrollTo?: { idx: number };
  onActiveChange?: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const items = Children.toArray(children);

  useEffect(() => {
    if (!scrollTo) return;
    const el = ref.current;
    if (!el) return;
    const child = el.children[scrollTo.idx] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({ left: target, behavior: "smooth" });
  }, [scrollTo]);

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
    if (best !== active) { setActive(best); onActiveChange?.(best); }
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
