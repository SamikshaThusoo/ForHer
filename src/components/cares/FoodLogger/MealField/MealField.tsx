"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { logText, type MealType } from "@/lib/forher/foodlog";
import styles from "./MealField.module.css";

/** The shared save surface for free-text logging: an editable meal field + Save.
 *  Typing fills it directly; Voice fills `value` by transcription. Both save through
 *  this one path, so there is a single save button, not several. */
export function MealField({ meal, method, value, onChange, topSlot, note, placeholder }: {
  meal: MealType;
  method: "typed" | "voice";
  value: string;
  onChange: (v: string) => void;
  topSlot?: ReactNode;
  note?: ReactNode;
  placeholder?: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [saved, setSaved] = useState(false);
  const canSave = value.trim().length > 0 && !saved;

  const save = () => {
    if (!canSave) return;
    logText(meal, value, method);
    setSaved(true);
    window.setTimeout(() => router.push("/"), 650);
  };

  return (
    <div className={styles.wrap}>
      {topSlot}
      <label className={styles.label} htmlFor="mealField">What did you eat?</label>
      <textarea
        id="mealField"
        className={styles.field}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "e.g. two rotis, dal and a bowl of curd"}
        rows={3}
      />
      {note}
      <motion.button
        type="button"
        className={styles.save}
        onClick={save}
        disabled={!canSave}
        whileTap={reduce || !canSave ? undefined : { scale: 0.98 }}
      >
        {saved ? <><Check size={16} /> Saved {meal}</> : <>Save {meal}</>}
      </motion.button>
    </div>
  );
}
