import type { Persona } from "@/types/persona";
import { PMOS_LABEL_FIRST_MENTION } from "./constants";

export interface EntryFraming {
  state: "A" | "B" | "C";
  eyebrow: string;
  headline: string;
  sub: string;
  cta: string;
  /** State-A only: the flagged AHC markers to show as chips. */
  markers?: { label: string; value: string }[];
  urgency: "high" | "normal" | "low";
}

export function entryFraming(persona: Persona): EntryFraming | null {
  const p = persona.pmos;
  if (!p || !p.eligible || p.entryState === "D") return null;

  if (p.entryState === "A") {
    const a = p.ahcMarkers ?? {};
    const markers: { label: string; value: string }[] = [];
    if (a.bmi != null) markers.push({ label: "BMI", value: String(a.bmi) });
    if (a.hba1c != null) markers.push({ label: "HbA1c", value: `${a.hba1c.toFixed(1)}%` });
    if (a.tsh != null) markers.push({ label: "TSH", value: `${a.tsh}` });
    return {
      state: "A", urgency: "high",
      eyebrow: "Flagged in your health check",
      headline: "A few markers worth a closer look",
      sub: `These can be linked to ${PMOS_LABEL_FIRST_MENTION} — a quick check tells you more.`,
      cta: "Take the 2-minute check", markers,
    };
  }
  if (p.entryState === "C") {
    return {
      state: "C", urgency: "low",
      eyebrow: "For Her",
      headline: "Understand your cycle & hormones",
      sub: `A 2-minute check screens for ${PMOS_LABEL_FIRST_MENTION}. No health report needed.`,
      cta: "Take the check — no report needed",
    };
  }
  return {
    state: "B", urgency: "normal",
    eyebrow: "For Her",
    headline: "A quick check for your hormonal health",
    sub: `See whether ${PMOS_LABEL_FIRST_MENTION} patterns apply to you.`,
    cta: "Take the 2-minute check",
  };
}
