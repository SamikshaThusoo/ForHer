import type { Persona } from "@/types/persona";
import type { CareTrack, Specialist, Touchpoint } from "@/types/journey";
import { CC_CADENCE_DAYS, TOUCHPOINT_SCHEDULE } from "./constants";
import { getRiskOutcome } from "./risk";

export function personaTrack(persona: Persona): CareTrack {
  if (!persona.pmos || !persona.pmos.eligible) return "none";
  return getRiskOutcome(persona.pmos.assessment, persona.pmos.ahcMarkers);
}

export function getTouchpointsDue(persona: Persona, dayIndex: number): Touchpoint[] {
  const track = personaTrack(persona);
  const scheduled: Touchpoint[] = TOUCHPOINT_SCHEDULE
    .filter((row) => row.day === dayIndex && row.tracks.includes(track))
    .map((row) => ({ day: row.day, kind: row.kind, services: row.services, label: row.label, retest: row.retest }));

  const cadence = CC_CADENCE_DAYS[track];
  if (dayIndex > 0 && cadence && dayIndex % cadence === 0 && scheduled.length === 0) {
    scheduled.push({ day: dayIndex, kind: "cc-connect", services: ["care-coordinator"], label: "Care Coordinator check-in" });
  }
  return scheduled;
}

export function getCareCircle(
  tier: CareTrack,
  flags: { acneOrHirsutism: boolean; ttc: boolean; highMetabolic: boolean },
): Specialist[] {
  const circle: Specialist[] = [];
  if (tier === "none") {
    circle.push({ role: "care-coordinator", label: "Care Coordinator", reason: "Keeps your engagement track on track and re-screens you over time." });
    return circle;
  }
  circle.push({ role: "doctor", label: "Doctor", reason: "Reviews your screen and oversees your plan." });
  circle.push({ role: "nutritionist", label: "Nutritionist", reason: "Builds your diet around steady blood sugar." });
  circle.push({ role: "care-coordinator", label: "Care Coordinator", reason: "Your single point of contact between visits." });
  if (tier === "high") {
    circle.push({ role: "psychologist", label: "Psychologist", reason: "Support for mood and stress, which PMOS can affect." });
  }
  if (flags.acneOrHirsutism) {
    circle.push({ role: "dermatologist", label: "Dermatologist", reason: "Addresses skin and hair changes." });
  }
  if (flags.ttc || tier === "high") {
    circle.push({ role: "gynaecologist", label: "Gynaecologist", reason: flags.ttc ? "Guides pre-conception planning." : "Reviews cycle and hormonal markers." });
  }
  return circle;
}
