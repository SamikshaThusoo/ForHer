import type { ScoreBand } from "@/types/persona";

export function bandFor(score: number): ScoreBand {
  if (score < 300) return "poor";
  if (score < 600) return "fair";
  if (score < 750) return "warm";
  return "good";
}

export function labelFor(score: number): "Poor" | "Fair" | "Good" | "Excellent" {
  const band = bandFor(score);
  switch (band) {
    case "poor": return "Poor";
    case "fair": return "Fair";
    case "warm": return "Good";
    case "good": return "Excellent";
  }
}

export function colorVarFor(score: number): string {
  const band = bandFor(score);
  switch (band) {
    case "poor": return "--color-score-poor";
    case "fair": return "--color-score-fair";
    case "warm": return "--color-score-warm";
    case "good": return "--color-score-good";
  }
}

export function percentile(score: number, populationAvg: number): number {
  // Toy mapping for the prototype — converts score delta vs. avg into a "% healthier than" headline.
  const delta = score - populationAvg;
  const pct = Math.max(5, Math.min(95, Math.round(50 + delta / 6)));
  return pct;
}
