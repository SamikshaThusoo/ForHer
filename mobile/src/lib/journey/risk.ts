import type { AhcMarkers, AssessmentAnswers, DomainSignals, RiskOutcome } from "@/types/journey";

export function getDomainSignals(a: AssessmentAnswers, ahc?: AhcMarkers): DomainSignals {
  const androgenic = a.acneSkin || a.hairChanges;

  const metabolicLab = !!ahc && ((ahc.bmi ?? 0) >= 25 || (ahc.hba1c ?? 0) >= 5.7);
  const metabolic = a.weightDifficulty || metabolicLab;

  const polyendocrine =
    a.irregularPeriods || a.familyHistory || (!!ahc && (ahc.tsh ?? 0) >= 4.0);

  const positiveCount = [androgenic, metabolic, polyendocrine].filter(Boolean).length;

  // Low confidence when the metabolic read leans on self-report with no labs to confirm.
  const hasLabs = !!ahc && (ahc.bmi != null || ahc.hba1c != null);
  const confidence: DomainSignals["confidence"] =
    metabolic && !metabolicLab && !hasLabs ? "low" : "high";

  return { androgenic, metabolic, polyendocrine, positiveCount, confidence };
}

export function getRiskOutcome(a: AssessmentAnswers, ahc?: AhcMarkers): RiskOutcome {
  const s = getDomainSignals(a, ahc);
  let outcome: RiskOutcome =
    s.positiveCount === 0 ? "none" :
    s.positiveCount === 1 ? "low" :
    s.positiveCount === 2 ? "medium" : "high";

  if (outcome === "medium" && ahc && ((ahc.hba1c ?? 0) >= 6.0 || (ahc.bmi ?? 0) >= 30)) {
    outcome = "high";
  }
  return outcome;
}
