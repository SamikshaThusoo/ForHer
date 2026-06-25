"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import type { AssessmentAnswers } from "@/types/journey";
import { getDomainSignals, getRiskOutcome, TRACK_LABELS } from "@/lib/journey";
import { markAssessed, saveSchedule } from "@/lib/forher/state";
import { ScheduleCollection } from "@/components/forher/ScheduleCollection/ScheduleCollection";
import { Assessment } from "@/components/forher/Assessment/Assessment";
import { RiskResult } from "@/components/forher/RiskResult/RiskResult";
import { Routing } from "@/components/forher/Routing/Routing";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import styles from "./for-her.module.css";

type Step = "questions" | "result" | "routing" | "schedule" | "done";

const BLANK: AssessmentAnswers = {
  irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false,
};

export default function ForHerPage() {
  const { persona } = usePersona();
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
          <Link href="/forher" className={styles.homeLink}>Back to home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.header}>
        <Link href="/forher" className={styles.back} aria-label="Back to home"><ChevronLeft size={20} /></Link>
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
            if (outcome === "none") { markAssessed(persona.id); setStep("done"); }
            else setStep("schedule");
          }}
        />
      )}

      {step === "schedule" && (
        <ScheduleCollection
          onComplete={(s) => { saveSchedule(persona.id, s); markAssessed(persona.id); setStep("done"); }}
        />
      )}

      {step === "done" && (
        <div className={styles.done}>
          <CheckCircle2 size={44} className={styles.doneMark} />
          <h2 className={styles.doneTitle}>
            {outcome === "none" ? "You're all set" : "Your plan is ready"}
          </h2>
          <p className={styles.doneSub}>
            {outcome === "none"
              ? "We'll keep you on the engagement track and re-check over time."
              : `You're on the ${TRACK_LABELS[outcome]}. Your daily companion is where it all comes together.`}
          </p>
          <Link href="/forher" className={styles.doneCta}>
            {outcome === "none" ? "Go to my companion" : "Go to my dashboard"}
          </Link>
        </div>
      )}
    </main>
  );
}
