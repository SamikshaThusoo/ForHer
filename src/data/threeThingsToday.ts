// Convenience accessor — pulls today's three-things from the active program week.
import { PREDIABETES_REVERSAL } from "./careProgram";
import type { ProgramKey } from "@/types/persona";

export function threeThingsFor(program: ProgramKey, week: number) {
  if (program !== "prediabetes-reversal") return [];
  const w = PREDIABETES_REVERSAL.weeks.find((x) => x.week === week);
  return w?.threeThingsToday ?? [];
}
