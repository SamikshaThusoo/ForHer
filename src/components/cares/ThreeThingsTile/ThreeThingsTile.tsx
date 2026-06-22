"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { threeThingsFor } from "@/data/threeThingsToday";
import styles from "./ThreeThingsTile.module.css";

export function ThreeThingsTile() {
  const { persona } = usePersona();
  const program = persona.cares.primaryProgram!;
  const week = persona.cares.weekOfTwelve ?? 1;
  const things = threeThingsFor(program, week);
  const [done, setDone] = useState<Set<string>>(new Set(things.slice(0, 2).map((t) => t.id)));

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className={styles.tile}>
      <div className={styles.head}>
        <h2 className={styles.title}>3 things today</h2>
        <span className={styles.count}>
          <span className={styles.countNum}>{done.size}</span> of {things.length}
        </span>
      </div>
      <ul className={styles.list}>
        {things.map((t) => {
          const isDone = done.has(t.id);
          return (
            <li key={t.id}>
              <motion.button
                className={styles.row}
                onClick={() => toggle(t.id)}
                aria-pressed={isDone}
                whileTap={{ scale: 0.985 }}
              >
                <span className={isDone ? styles.checkDone : styles.checkTodo}>
                  <AnimatePresence>
                    {isDone && (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ display: "inline-flex" }}
                      >
                        <Check size={13} strokeWidth={3} color="#fff" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className={styles.body}>
                  <span className={isDone ? styles.labelDone : styles.label}>{t.label}</span>
                  <span className={styles.anchor}>{t.anchor}</span>
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
