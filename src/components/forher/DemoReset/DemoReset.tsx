"use client";
import { resetForHer } from "@/lib/forher/state";
import { RotateCcw } from "lucide-react";
import styles from "./DemoReset.module.css";

export function DemoReset() {
  return (
    <button
      type="button"
      className={styles.reset}
      onClick={() => { resetForHer(); window.location.href = "/"; }}
      title="Clear all demo state"
    >
      <RotateCcw size={13} /> Reset
    </button>
  );
}
