import type { Persona } from "@/types/persona";
import { getTouchpointsDue } from "@/lib/journey";

export type ConsultInfo = { day: number; service: string; label: string };

// Services we surface as a specialist consult card (everything else — prep, labs,
// care-coordinator — is handled by the test flow or skipped).
const SPECIALISTS = ["doctor", "nutritionist", "psychologist", "dermatology", "gynae"];

/** All specialist consults across the 90-day plan, in day order. */
function allConsults(persona: Persona): ConsultInfo[] {
  const out: ConsultInfo[] = [];
  for (let d = 1; d <= 90; d++) {
    getTouchpointsDue(persona, d).forEach((t) => {
      if ((t.kind === "consult" || t.kind === "baseline") && SPECIALISTS.includes(t.services[0])) {
        out.push({ day: d, service: t.services[0], label: t.label });
      }
    });
  }
  return out;
}

/** The next consult on or after today (the "you've a consult" heads-up). */
export function upcomingConsult(persona: Persona, day: number): ConsultInfo | null {
  return allConsults(persona).find((c) => c.day >= day) ?? null;
}

/** The most recent consult whose day has passed (the "from your consult" card). */
export function lastDoneConsult(persona: Persona, day: number): ConsultInfo | null {
  const done = allConsults(persona).filter((c) => c.day < day);
  return done.length ? done[done.length - 1] : null;
}

/** Does this persona's plan include a Day-90 retest? */
export function hasRetest(persona: Persona): boolean {
  for (let d = 1; d <= 90; d++) {
    if (getTouchpointsDue(persona, d).some((t) => t.kind === "retest")) return true;
  }
  return false;
}
