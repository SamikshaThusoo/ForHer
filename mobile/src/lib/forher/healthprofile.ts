import { storage } from "@/lib/storage";
// Editable health profile for ClinicForHer. Captured/persisted per persona; the two
// live flags (ttc, skinHairChanges) feed the care-circle via careCircleFlags — they do
// NOT recompute the risk tier. BMI/labs are captured for the care team, not rescored.

export type HealthProfile = {
  heightCm?: number;
  weightKg?: number;
  ttc?: boolean; // overrides persona.pmos.ttc for the care circle
  skinHairChanges?: boolean; // overrides the androgenic signal for the care circle
  everPregnant?: boolean;
  pregnancyNotes?: string;
};

const key = (id: string) => `forher.${id}.healthprofile`;

export function bmiFrom(p: HealthProfile): number | null {
  if (!p.heightCm || !p.weightKg || p.heightCm <= 0) return null;
  const m = p.heightCm / 100;
  return Math.round((p.weightKg / (m * m)) * 10) / 10;
}
export function readHealthProfile(id: string): HealthProfile {
  try {
    const raw = JSON.parse(storage.getItem(key(id)) ?? "null");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as HealthProfile) : {};
  } catch {
    return {};
  }
}
export function writeHealthProfile(id: string, p: HealthProfile) {
  try {
    storage.setItem(key(id), JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
