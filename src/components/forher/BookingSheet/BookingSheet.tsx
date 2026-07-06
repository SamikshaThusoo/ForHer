"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Stethoscope, FlaskConical, ShieldCheck } from "lucide-react";
import type { CareItem } from "@/lib/journey";
import { PLACEHOLDER_SLOTS } from "@/lib/forher/clinic";
import styles from "./BookingSheet.module.css";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 38 };

/** Prototype booking confirm — specialist/test + placeholder slot + a note that her
 *  health context is shared. Confirm persists a booked state (handled by the parent).
 *  Modal semantics: focus trap, Esc, scroll lock, return focus. */
export function BookingSheet({
  item,
  onConfirm,
  onClose,
}: {
  item: CareItem | null;
  onConfirm: (item: CareItem, slot: string) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const open = item !== null;
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

  const slot = item ? PLACEHOLDER_SLOTS[item.kind] : "";
  const Icon = item?.kind === "test" ? FlaskConical : Stethoscope;

  return (
    <AnimatePresence>
      {open && item && (
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
            aria-label={`Book ${item.label}`}
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
            <div className={styles.header}>
              <span className={styles.icon}>
                <Icon size={20} />
              </span>
              <div>
                <span className={styles.eyebrow}>Confirm your booking</span>
                <h2 className={styles.title}>{item.label}</h2>
              </div>
              <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className={styles.why}>{item.reason}</p>
            <div className={styles.slot}>{slot}</div>
            <p className={styles.shared}>
              <ShieldCheck size={14} aria-hidden /> Your health context is shared, so your clinician arrives informed.
            </p>
            <button type="button" className={styles.confirm} onClick={() => onConfirm(item, slot)}>
              Confirm booking
            </button>
            <p className={styles.disclaimer}>
              This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
