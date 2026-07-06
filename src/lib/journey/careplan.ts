import type { Persona } from "@/types/persona";
import type { CareTrack, Specialist } from "@/types/journey";
import type { HealthProfile } from "@/lib/forher/healthprofile";
import { getCareCircle, personaTrack } from "./touchpoints";
import { getDomainSignals } from "./risk";

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
export function careCircleFlags(persona: Persona, profile: HealthProfile) {
  const androgenic = persona.pmos
    ? getDomainSignals(persona.pmos.assessment, persona.pmos.ahcMarkers).androgenic
    : false;
  return {
    acneOrHirsutism: profile.skinHairChanges ?? androgenic,
    ttc: profile.ttc ?? !!persona.pmos?.ttc,
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
export function getClinicPlan(persona: Persona, profile: HealthProfile): ClinicPlan {
  return clinicPlanFor(personaTrack(persona), careCircleFlags(persona, profile));
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
