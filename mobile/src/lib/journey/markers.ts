import type { Persona } from "@/types/persona";
import type { MarkerSet, TransitionOption } from "@/types/journey";

export function homaIr(fbs?: number, insulin?: number): number | undefined {
  if (fbs == null || insulin == null) return undefined;
  return (fbs * insulin) / 405;
}
export function lhFshRatio(lh?: number, fsh?: number): number | undefined {
  if (lh == null || fsh == null || fsh === 0) return undefined;
  return lh / fsh;
}

function lerp(a: number | undefined, b: number | undefined, t: number): number | undefined {
  if (a == null && b == null) return undefined;
  if (a == null) return b;
  if (b == null) return a;
  return a + (b - a) * t;
}

function blend(from: MarkerSet, to: MarkerSet, t: number): MarkerSet {
  const keys: (keyof MarkerSet)[] = ["bmi","hba1c","fbs","insulinFasting","tsh","lh","fsh","testosterone","weightKg","waistCm"];
  const out: MarkerSet = {};
  for (const k of keys) {
    const v = lerp(from[k] as number | undefined, to[k] as number | undefined, t);
    if (v != null) (out[k] as number) = Math.round(v * 10) / 10;
  }
  out.homaIr = homaIr(out.fbs, out.insulinFasting);
  out.lhFshRatio = lhFshRatio(out.lh, out.fsh);
  return out;
}

export function getMarkerSnapshot(persona: Persona, dayIndex: number): MarkerSet {
  const ms = persona.pmos?.markers;
  if (!ms) return {};
  if (dayIndex <= 0) return blend(ms.day0, ms.day0, 0);
  if (dayIndex <= 90) return blend(ms.day0, ms.day90, dayIndex / 90);
  if (dayIndex <= 180) return blend(ms.day90, ms.day180, (dayIndex - 90) / 90);
  return blend(ms.day180, ms.day180, 0);
}

export function getOutcomesComparison(persona: Persona) {
  return {
    day0: getMarkerSnapshot(persona, 0),
    day90: getMarkerSnapshot(persona, 90),
    day180: getMarkerSnapshot(persona, 180),
  };
}

export function getTransitionOptions(persona: Persona): TransitionOption[] {
  const { day0, day180 } = getOutcomesComparison(persona);
  const improved =
    (day180.hba1c != null && day0.hba1c != null && day180.hba1c < day0.hba1c) ||
    (day180.weightKg != null && day0.weightKg != null && day180.weightKg < day0.weightKg);
  const ttc = !!persona.pmos?.ttc;

  const rec: TransitionOption["key"] = ttc ? "tulip-handoff" : improved ? "step-down" : "continue-structured";
  const opts: TransitionOption[] = [
    { key: "step-down", title: "Step down to maintenance", detail: "Daily companion + a quarterly check-in.", recommended: false },
    { key: "continue-structured", title: "Continue structured care", detail: "Stay on the supervised plan a while longer.", recommended: false },
    { key: "tulip-handoff", title: "Warm handoff to Tulip", detail: "Move into pre-conception care; your record carries over.", recommended: false },
  ];
  return opts.map((o) => ({ ...o, recommended: o.key === rec }));
}
