import type { JourneyPhase } from "@/types/journey";
import { PHASE_BOUNDS } from "./constants";

export function getPhase(dayIndex: number): JourneyPhase {
  if (dayIndex <= 0) return "entry";
  for (const b of PHASE_BOUNDS) {
    if (dayIndex >= b.from && dayIndex <= b.to) return b.phase;
  }
  return "review"; // beyond Day 182
}
