"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import styles from "./Sheet.module.css";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 38 };

/** Reusable bottom-sheet shell: scrim fade, spring slide, drag-to-dismiss, focus
 *  trap, scroll lock, Esc, return focus, reduced motion. Content is the children. */
export function Sheet({
  open,
  onClose,
  ariaLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      sheetRef.current
        ? Array.from(
            sheetRef.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])'),
          ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null)
        : [];
    const t = setTimeout(() => focusables()[0]?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.scrim}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
        >
          <motion.div
            ref={sheetRef}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { y: "100%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }}
            transition={reduce ? { duration: 0 } : SPRING}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose();
            }}
          >
            <div className={styles.grab} aria-hidden />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
