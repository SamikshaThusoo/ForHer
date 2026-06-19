"use client";
import type { DomainSignals, RiskOutcome } from "@/types/journey";
import { Check, Minus, Info, ArrowRight } from "lucide-react";
import styles from "./RiskResult.module.css";

const OUTCOME_META: Record<RiskOutcome, { label: string; idx: number }> = {
  none: { label: "No risk signals", idx: 0 },
  low: { label: "Low", idx: 1 },
  medium: { label: "Medium", idx: 2 },
  high: { label: "High", idx: 3 },
};

const DOMAINS: { key: keyof Pick<DomainSignals, "androgenic" | "metabolic" | "polyendocrine">; label: string; hint: string }[] = [
  { key: "androgenic", label: "Androgenic", hint: "Skin & hair signs" },
  { key: "metabolic", label: "Metabolic", hint: "Weight & blood sugar" },
  { key: "polyendocrine", label: "Polyendocrine", hint: "Cycle & hormones" },
];

export function RiskResult({
  signals, outcome, confidence, onContinue,
}: {
  signals: DomainSignals;
  outcome: RiskOutcome;
  confidence: "high" | "low";
  onContinue: () => void;
}) {
  const meta = OUTCOME_META[outcome];
  return (
    <div className={styles.wrap}>
      <span className={styles.eyebrow}>Your result · a screen, not a diagnosis</span>
      <h2 className={styles.title}>
        {outcome === "none" ? "No PMOS signals right now" : `${meta.label} likelihood of PMOS (PCOS)`}
      </h2>

      <div className={styles.meter} data-outcome={outcome}>
        {(["none", "low", "medium", "high"] as RiskOutcome[]).map((o, i) => (
          <span key={o} className={`${styles.stop} ${i === meta.idx ? styles.active : ""}`}>
            {OUTCOME_META[o].label.split(" ")[0]}
          </span>
        ))}
      </div>

      <p className={styles.explain}>
        We look at three domains. Signals in any two of three point to a higher likelihood.
      </p>

      <div className={styles.domains}>
        {DOMAINS.map((d) => {
          const met = signals[d.key];
          return (
            <div key={d.key} className={`${styles.domain} ${met ? styles.metRow : ""}`}>
              <span className={`${styles.icon} ${met ? styles.metIcon : ""}`}>
                {met ? <Check size={14} /> : <Minus size={14} />}
              </span>
              <span className={styles.dlabel}>{d.label}<em>{d.hint}</em></span>
              <span className={styles.dstate}>{met ? "Signal present" : "No signal"}</span>
            </div>
          );
        })}
      </div>

      {confidence === "low" && (
        <div className={styles.caveat}>
          <Info size={15} />
          <div>
            <strong>Confidence: indicative.</strong> Without lab values we&apos;ve screened on your answers alone.
            <button type="button" className={styles.bookLabs}>Book labs to confirm</button>
          </div>
        </div>
      )}

      <button type="button" className={styles.cta} onClick={onContinue}>
        {outcome === "none" ? "See what's next" : "See my care plan"} <ArrowRight size={16} />
      </button>
    </div>
  );
}
