"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePersona } from "@/context/PersonaContext";
import type { AssessmentAnswers } from "@/types/journey";
import { getDomainSignals, getRiskOutcome } from "@/lib/journey";
import { markAssessed, saveSchedule } from "@/lib/forher/state";
import { ScheduleCollection } from "@/components/forher/ScheduleCollection/ScheduleCollection";
import { Assessment } from "@/components/forher/Assessment/Assessment";
import { RiskResult } from "@/components/forher/RiskResult/RiskResult";
import { Routing } from "@/components/forher/Routing/Routing";
import { ChevronLeft } from "lucide-react";
import styles from "./for-her.module.css";

type Step = "questions" | "result" | "routing" | "schedule";

const BLANK: AssessmentAnswers = {
  irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false,
};

export default function ForHerPage() {
  const { persona } = usePersona();
  const router = useRouter();
  const pmos = persona.pmos;
  const [step, setStep] = useState<Step>("questions");
  const [answers, setAnswers] = useState<AssessmentAnswers>(pmos?.assessment ?? BLANK);

  const signals = useMemo(() => getDomainSignals(answers, pmos?.ahcMarkers), [answers, pmos]);
  const outcome = useMemo(() => getRiskOutcome(answers, pmos?.ahcMarkers), [answers, pmos]);
  // Cold start (no AHC) is always indicative — the metabolic picture is incomplete
  // regardless of outcome, so the result surfaces the book-labs prompt (spec §2.1).
  const confidence = !pmos?.hasAhc ? "low" : signals.confidence;

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
          onContinue={() => setStep("routing")}
        />
      )}

      {step === "routing" && (
        <Routing
          outcome={outcome}
          signals={signals}
          persona={persona}
          onConsent={() => {
            if (outcome === "none") { markAssessed(persona.id); router.push("/"); }
            else setStep("schedule");
          }}
        />
      )}

      {step === "schedule" && (
        <ScheduleCollection
          onComplete={(s) => { saveSchedule(persona.id, s); markAssessed(persona.id); router.push("/clinic"); }}
        />
      )}
    </main>
  );
}
