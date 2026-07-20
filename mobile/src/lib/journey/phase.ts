import type { JourneyPhase } from "@/types/journey";
import { PHASE_BOUNDS } from "./constants";

export function getPhase(dayIndex: number): JourneyPhase {
  for (const b of PHASE_BOUNDS) {
    if (dayIndex >= b.from && dayIndex <= b.to) return b.phase;
  }
  return dayIndex < 1 ? "foundation" : "milestone"; // clamp below/above the 90-day window
}
