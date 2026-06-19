"use client";
import { useState } from "react";
import { Camera, Sparkles } from "lucide-react";
import { FOODS } from "@/data/foods";
import styles from "./PhotoMode.module.css";

export function PhotoMode({ onLog }: { onLog: (foodId: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [recognized, setRecognized] = useState<{ id: string; name: string; imageHint?: string } | null>(null);

  function fakeCapture() {
    setScanning(true);
    setTimeout(() => {
      const candidate = FOODS[Math.floor(Math.random() * FOODS.length)];
      setRecognized({ id: candidate.id, name: candidate.name, imageHint: candidate.imageHint });
      setScanning(false);
    }, 900);
  }

  return (
    <div className={styles.wrap}>
      {!recognized ? (
        <button className={styles.capture} onClick={fakeCapture} disabled={scanning}>
          <span className={styles.captureInner}>
            <span className={styles.cam}>
              {scanning ? (
                <Sparkles size={60} strokeWidth={1.4} color="rgba(255,255,255,0.85)" />
              ) : (
                <Camera size={60} strokeWidth={1.4} />
              )}
            </span>
            <span className={styles.cap}>
              {scanning ? "Recognising…" : "Tap to capture your meal."}
            </span>
          </span>
        </button>
      ) : (
        <div className={styles.confirm}>
          <div className={styles.preview}>
            <span className={styles.emoji}>{recognized.imageHint ?? "🍽"}</span>
          </div>
          <div className={styles.confirmBody}>
            <p className={styles.detected}>Detected</p>
            <p className={styles.detectedName}>{recognized.name}</p>
            <div className={styles.row}>
              <button className={styles.secondary} onClick={() => setRecognized(null)}>Retake</button>
              <button className={styles.primary} onClick={() => onLog(recognized.id)}>Looks right — log it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
