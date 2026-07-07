"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePersona } from "@/context/PersonaContext";
import type { AssessmentAnswers } from "@/types/journey";
import { getDomainSignals, getRiskOutcome } from "@/lib/journey";
import { markAssessed, readCycleLog } from "@/lib/forher/state";
import { activeConditions } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { Assessment } from "@/components/forher/Assessment/Assessment";
import { RiskResult } from "@/components/forher/RiskResult/RiskResult";
import { Recommendations } from "@/components/forher/Recommendations/Recommendations";
import { ClinicHub } from "@/components/forher/ClinicHub/ClinicHub";
import { ChevronLeft } from "lucide-react";
import styles from "./for-her.module.css";

type Step = "questions" | "result" | "recommend" | "hub";

const BLANK: AssessmentAnswers = {
  irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false,
};

export default function ForHerPage() {
  const { persona } = usePersona();
  const router = useRouter();
  const pmos = persona.pmos;
  const [step, setStep] = useState<Step>("questions");
  const [answers, setAnswers] = useState<AssessmentAnswers>(pmos?.assessment ?? BLANK);
  const [consented, setConsented] = useState(false);

  const signals = useMemo(() => getDomainSignals(answers, pmos?.ahcMarkers), [answers, pmos]);
  const outcome = useMemo(() => getRiskOutcome(answers, pmos?.ahcMarkers), [answers, pmos]);
  // Cold start (no AHC) is always indicative — the metabolic picture is incomplete.
  const confidence = !pmos?.hasAhc ? "low" : signals.confidence;
  const flags = useMemo(
    () => ({ acneOrHirsutism: signals.androgenic, ttc: !!pmos?.ttc, highMetabolic: outcome === "high" }),
    [signals, pmos, outcome],
  );

  // Has she logged irregularities (missed / irregular / symptoms)? If so, even a
  // no-/low-risk result should still route to the clinic for a check-in.
  const cycleLog = typeof window === "undefined" ? null : readCycleLog(persona.id);
  const hasConditions =
    typeof window !== "undefined" &&
    activeConditions({
      persona,
      cycleLog,
      dayLog: readDayLog(persona.id),
      cycleLength: cycleLengthFor(persona, cycleLog?.cycleLength),
      today: new Date(),
    }).length > 0;

  const enroll = () => {
    markAssessed(persona.id);
    router.push("/");
  };
  const goClinic = () => {
    markAssessed(persona.id);
    router.push("/clinic");
  };

  if (!pmos?.eligible) {
    return (
      <main className={`${styles.page} fhTheme`}>
        <div className={styles.notAvail}>
          <p>For Her isn&apos;t available for this profile.</p>
          <Link href="/" className={styles.homeLink}>Back to home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.header}>
        <Link href="/" className={styles.back} aria-label="Back to home"><ChevronLeft size={20} /></Link>
        <span className={styles.brand}>For Her</span>
      </header>

      {step === "questions" && (
        <Assessment
          initial={answers}
          hasAhc={pmos.hasAhc}
          entryState={pmos.entryState}
          onComplete={(a) => { setAnswers(a); setStep("result"); }}
        />
      )}

      {step === "result" && (
        <RiskResult
          signals={signals}
          outcome={outcome}
          confidence={confidence}
          onContinue={() => {
            if (outcome === "none") { if (hasConditions) goClinic(); else enroll(); }
            else setStep("recommend");
          }}
        />
      )}

      {step === "recommend" && (
        <Recommendations tier={outcome} flags={flags} onContinue={() => setStep("hub")} />
      )}

      {step === "hub" && (
        <div className={styles.hubStep}>
          <span className={styles.hubEyebrow}>A few ways we&apos;ll support you</span>
          <h2 className={styles.hubH2}>Your care, in one place</h2>
          <p className={styles.hubLede}>Book a visit, meet your team, keep your profile current — anytime.</p>
          <ClinicHub persona={persona} tier={outcome} showRecommended={false} />
          <label className={styles.consent}>
            <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} />
            <span>I understand this is lifestyle support — not a diagnosis or prescription.</span>
          </label>
          <button type="button" className={styles.start} disabled={!consented} onClick={enroll}>
            Start my plan →
          </button>
          <button type="button" className={styles.skip} onClick={goClinic}>
            Not now — just book a check-in
          </button>
        </div>
      )}
    </main>
  );
}
