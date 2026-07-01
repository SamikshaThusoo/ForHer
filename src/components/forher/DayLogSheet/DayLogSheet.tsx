"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { FLOWS, SYMPTOM_GROUPS, isEmptyEntry, type DayEntry, type Flow } from "@/lib/forher/daylog";
import styles from "./DayLogSheet.module.css";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 38 };

/** Bottom sheet for logging a day's flow + symptoms, over the tracker (no route
 *  change). Flow marks the period day; symptoms are structured, multi-select,
 *  on/off. Modal semantics: focus trap, Esc, scroll lock, return focus. */
export function DayLogSheet({
  dateISO,
  entry,
  labelDate,
  onSave,
  onClose,
}: {
  dateISO: string | null;
  entry: DayEntry;
  labelDate: string;
  onSave: (iso: string, entry: DayEntry) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const open = dateISO !== null;
  const sheetRef = useRef<HTMLDivElement>(null);

  const [flow, setFlow] = useState<Flow | undefined>(entry.flow);
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set(entry.symptoms ?? []));

  // Re-seed the draft each time a new day is opened.
  useEffect(() => {
    if (dateISO !== null) {
      setFlow(entry.flow);
      setSymptoms(new Set(entry.symptoms ?? []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISO]);

  // Modal behaviour: lock scroll, trap focus, Esc to close, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      sheetRef.current
        ? Array.from(
            sheetRef.current.querySelectorAll<HTMLElement>(
              'button, [href], input, [tabindex]:not([tabindex="-1"])',
            ),
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

  const toggleSymptom = (id: string) =>
    setSymptoms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const commit = () => {
    if (dateISO === null) return;
    onSave(dateISO, { period: !!flow, flow, symptoms: [...symptoms] });
    onClose();
  };

  const draftEmpty = isEmptyEntry({ period: !!flow, flow, symptoms: [...symptoms] });

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
            aria-label={`Log for ${labelDate}`}
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
              <div>
                <span className={styles.eyebrow}>Log your day</span>
                <h2 className={styles.title}>{labelDate}</h2>
              </div>
              <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className={styles.content}>
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Flow</span>
                <div className={styles.chips}>
                  {FLOWS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={flow === f.id}
                      className={`${styles.chip} ${flow === f.id ? styles.chipOn : ""}`}
                      onClick={() => setFlow((cur) => (cur === f.id ? undefined : f.id))}
                    >
                      {f.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={flow === undefined}
                    className={`${styles.chip} ${flow === undefined ? styles.chipOn : ""}`}
                    onClick={() => setFlow(undefined)}
                  >
                    None
                  </button>
                </div>
                <p className={styles.hint}>A flow marks this as a period day.</p>
              </div>

              {SYMPTOM_GROUPS.map((g) => (
                <div key={g.group} className={styles.section}>
                  <span className={styles.sectionLabel}>{g.group}</span>
                  <div className={styles.chips}>
                    {g.items.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={symptoms.has(s.id)}
                        className={`${styles.chip} ${symptoms.has(s.id) ? styles.chipOn : ""}`}
                        onClick={() => toggleSymptom(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.saveBar}>
              <button type="button" className={styles.save} onClick={commit}>
                {draftEmpty ? "Clear day" : "Save"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
