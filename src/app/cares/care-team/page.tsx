"use client";
import { ShieldCheck } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { DoctorCard } from "@/components/cares/CareTeam/DoctorCard/DoctorCard";
import { CoachCard } from "@/components/cares/CareTeam/CoachCard/CoachCard";
import { RetestCountdown } from "@/components/cares/CareTeam/RetestCountdown/RetestCountdown";
import styles from "./careTeam.module.css";

export default function CareTeamPage() {
  const { persona } = usePersona();
  const { nextDoctorConsult, nextCoachSession, daysToMidRetest = 21 } = persona.cares;

  return (
    <main className={styles.main}>
      <h2 className={styles.title}>Your care team</h2>
      <p className={styles.sub}>Tele-doctor, weekly coach, and your next retest.</p>
      <RetestCountdown days={daysToMidRetest} />
      {nextDoctorConsult && (
        <DoctorCard doctor={nextDoctorConsult.doctor} dateIso={nextDoctorConsult.date} />
      )}
      {nextCoachSession && (
        <CoachCard coach={nextCoachSession.coach} dateIso={nextCoachSession.date} />
      )}
      <div className={styles.privacy}>
        <span className={styles.privacyIcon}>
          <ShieldCheck size={14} strokeWidth={2} />
        </span>
        <p className={styles.privacyText}>
          <span className={styles.privacyLabel}>Privacy:</span>
          your employer only sees aggregated workforce metrics. Individual data stays between you and your care team.
        </p>
      </div>
    </main>
  );
}
