import type { Persona } from "@/types/persona";
import { personaTrack } from "./touchpoints";
import { TRACK_LABELS } from "./constants";

const ENTRY_LABEL: Record<"A" | "B" | "C" | "D", string> = {
  A: "Warm — AHC flagged",
  B: "AHC, no flags",
  C: "Cold start — no AHC",
  D: "Not eligible",
};
const RISK_LABEL = { none: "No risk", low: "Low risk", medium: "Medium risk", high: "High risk" } as const;

function prettyProgram(key?: string): string {
  if (!key) return "enrolled";
  return key.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** A clear, demo-facing description of the scenario each persona represents.
 *  `tag` is the compact chip label; `full` is the one-line scenario caption. */
export function personaScenario(p: Persona): { tag: string; full: string } {
  const pmos = p.pmos;
  if (!pmos || !pmos.eligible) {
    if (p.cares.enrolled) {
      return { tag: "Cares · enrolled", full: `Habit Cares member · ${prettyProgram(p.cares.primaryProgram)}` };
    }
    return p.gender === "M"
      ? { tag: "Not eligible", full: "Not eligible for For Her (male) — standard Habit Cares" }
      : { tag: "Not enrolled", full: "Not enrolled" };
  }
  const track = personaTrack(p);
  const risk = RISK_LABEL[track];
  const ttc = pmos.ttc ? " · TTC" : "";
  return {
    tag: `Entry ${pmos.entryState} · ${risk}`,
    full: `${ENTRY_LABEL[pmos.entryState]} → ${risk} · ${TRACK_LABELS[track]}${ttc}`,
  };
}
