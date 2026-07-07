import type { Persona } from "@/types/persona";
import type { CareTrack, Specialist } from "@/types/journey";
import type { HealthProfile } from "@/lib/forher/healthprofile";
import type { CycleLog } from "@/lib/forher/state";
import { getCareCircle, personaTrack, getTouchpointsDue } from "./touchpoints";
import { getDomainSignals } from "./risk";
import { PROGRAM_LAST_DAY } from "./constants";

/** A recommended diagnostic test/panel, tier-driven. Sibling to getCareCircle's
 *  consults — one source of truth for "what care does this tier get". */
export type CareTest = { id: string; label: string; reason: string };

export function getCareTests(
  tier: CareTrack,
  _flags: { acneOrHirsutism: boolean; ttc: boolean; highMetabolic: boolean },
): CareTest[] {
  if (tier === "none" || tier === "low") return [];
  const tests: CareTest[] = [
    {
      id: "hormone-panel",
      label: "Hormone & PCOS-essentials panel",
      reason: "Clarifies the hormonal picture behind your markers.",
    },
  ];
  if (tier === "high") {
    tests.push({
      id: "pelvic-ultrasound",
      label: "Pelvic ultrasound",
      reason: "Checks the ovaries — part of a full PMOS work-up.",
    });
  }
  return tests;
}

/** Care-circle flags, with the health profile overriding persona defaults for the
 *  two live flags (skin/hair → androgenic, TTC). The tier itself is never changed. */
export function careCircleFlags(persona: Persona, profile: HealthProfile, cycleLog?: CycleLog | null) {
  const androgenic = persona.pmos
    ? getDomainSignals(persona.pmos.assessment, persona.pmos.ahcMarkers).androgenic
    : false;
  return {
    acneOrHirsutism: profile.skinHairChanges ?? androgenic,
    // One TTC truth from any declaration: the cycle intent, the profile toggle, or the seed.
    ttc: cycleLog?.intent === "ttc" || !!profile.ttc || !!persona.pmos?.ttc,
    highMetabolic: personaTrack(persona) === "high",
  };
}

export type CareItemKind = "consult" | "test";
export type CareItem = {
  id: string;
  kind: CareItemKind;
  label: string;
  reason: string;
  priority?: boolean;
};

export type ClinicPlan = {
  tier: CareTrack;
  primary: CareItem | null;
  secondary: CareItem[];
  showBooking: boolean;
};

const consultItem = (s: Specialist, priority = false): CareItem => ({
  id: s.role,
  kind: "consult",
  label: `${priority ? "Priority " : ""}${s.label} consult`,
  reason: s.reason,
  priority: priority || undefined,
});
const testItem = (t: CareTest): CareItem => ({ id: t.id, kind: "test", label: t.label, reason: t.reason });

/** Assembles the one-primary-then-secondary care plan for a tier from the existing
 *  care-circle engine + tier tests. Enforces "one action, not five". */
export function getClinicPlan(persona: Persona, profile: HealthProfile, cycleLog?: CycleLog | null): ClinicPlan {
  return clinicPlanFor(personaTrack(persona), careCircleFlags(persona, profile, cycleLog));
}

/** Same assembly from an explicit tier + flags — used during onboarding, where the
 *  tier comes from the live assessment answers rather than the persona seed. */
export function clinicPlanFor(
  tier: CareTrack,
  flags: { acneOrHirsutism: boolean; ttc: boolean; highMetabolic: boolean },
): ClinicPlan {
  const consults = getCareCircle(tier, flags);
  const tests = getCareTests(tier, flags);

  const gynae = consults.find((c) => c.role === "gynaecologist");
  const hormone = tests.find((t) => t.id === "hormone-panel");

  let primary: CareItem | null = null;
  if (tier === "high" && gynae) primary = consultItem(gynae, true);
  else if (tier === "medium") primary = gynae ? consultItem(gynae) : hormone ? testItem(hormone) : null;
  else if (tier === "low") {
    const doctor = consults.find((c) => c.role === "doctor") ?? consults[0];
    primary = doctor ? consultItem(doctor) : null;
  }
  // tier === "none" → primary stays null

  const all: CareItem[] = [...consults.map((c) => consultItem(c)), ...tests.map(testItem)];
  const secondary = all.filter((i) => !(primary && i.kind === primary.kind && i.id === primary.id));

  return { tier, primary, secondary, showBooking: tier !== "none" };
}

/** A clinical visit scheduled on a specific day of the 90-day plan. */
export type PlanVisit = { day: number; kind: "consult" | "test"; label: string; service: string };

/** The clinical visits scheduled across the 90-day plan (consults + retests), one
 *  per touchpoint day, in order. The prototype shows "Your bookings" against these. */
export function getPlanTouchpoints(persona: Persona): PlanVisit[] {
  const out: PlanVisit[] = [];
  for (let d = 1; d <= PROGRAM_LAST_DAY; d++) {
    for (const tp of getTouchpointsDue(persona, d)) {
      if (tp.kind === "cc-connect") continue;
      out.push({
        day: tp.day,
        kind: tp.kind === "retest" ? "test" : "consult",
        label: tp.label,
        service: tp.services[0],
      });
    }
  }
  return out;
}

/** Maps a CareItem id (specialist role / test id) to the touchpoint schedule's
 *  service key, so a booked item can be matched to its plan day. */
const SERVICE_OF_ITEM: Record<string, string> = {
  doctor: "doctor",
  nutritionist: "nutritionist",
  psychologist: "psychologist",
  dermatologist: "dermatology",
  "care-coordinator": "care-coordinator",
  gynaecologist: "gynae",
  "hormone-panel": "hormone-panel",
};
export function serviceForItem(itemId: string): string {
  return SERVICE_OF_ITEM[itemId] ?? itemId;
}

/** Plain-language "what's included" for each consult/test — so a clinical card is
 *  more than a title + one line, across every risk profile. Keyed by CareItem id. */
const INCLUDES: Record<string, string[]> = {
  doctor: [
    "A review of your screen and markers",
    "Your plan and any next steps",
    "Answers to your questions",
  ],
  gynaecologist: [
    "A review of your cycle and hormonal markers",
    "Any pelvic exam or scan you need",
    "A plan for irregular or painful periods",
  ],
  nutritionist: [
    "A diet built around steady blood sugar",
    "Simple food swaps for your routine",
    "A follow-up to adjust as you go",
  ],
  dermatologist: [
    "A look at skin and hair changes",
    "Options for acne or hair loss",
    "What's hormone-driven and what isn't",
  ],
  psychologist: [
    "Space to talk through mood and stress",
    "Coping tools that fit your cycle",
    "Ongoing support if you want it",
  ],
  "care-coordinator": [
    "Your single point of contact",
    "Help booking and prepping visits",
    "Chasing results and next steps",
  ],
  "hormone-panel": [
    "Key reproductive & thyroid hormones",
    "Insulin and metabolic markers",
    "A doctor talks you through the results",
  ],
  "pelvic-ultrasound": [
    "A look at your ovaries and uterus",
    "Part of a full PMOS work-up",
    "Reviewed with your gynaecologist",
  ],
};

export function careItemIncludes(id: string): string[] {
  return INCLUDES[id] ?? [];
}
