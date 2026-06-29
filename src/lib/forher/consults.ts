import type { Persona } from "@/types/persona";
import { getTouchpointsDue } from "@/lib/journey";

export type ConsultInfo = { day: number; service: string; label: string };

// Services we surface as a specialist consult card (everything else — prep, labs,
// care-coordinator — is handled by the test flow or skipped).
const SPECIALISTS = ["doctor", "nutritionist", "psychologist", "dermatology", "gynae"];

/** The specialist consult scheduled on exactly this care-plan day, if any. */
export function consultOnDay(persona: Persona, day: number): ConsultInfo | null {
  const tp = getTouchpointsDue(persona, day).find(
    (t) => (t.kind === "consult" || t.kind === "baseline") && SPECIALISTS.includes(t.services[0]),
  );
  return tp ? { day, service: tp.services[0], label: tp.label } : null;
}

/** Is there a retest (labs) scheduled on exactly this care-plan day? */
export function isRetestDay(persona: Persona, day: number): boolean {
  return getTouchpointsDue(persona, day).some((t) => t.kind === "retest");
}
