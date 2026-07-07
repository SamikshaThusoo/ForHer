"use client";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { getPlanTouchpoints, PHASE_BOUNDS } from "@/lib/journey";
import { readDayLog } from "@/lib/forher/daylog";
import { readHealthProfile, bmiFrom } from "@/lib/forher/healthprofile";
import { phaseActivity, logsInPhase, checkpointMarkers } from "@/lib/forher/progressview";
import { Trophy, Lock, CheckCircle2, FlaskConical, Stethoscope, Droplet, ClipboardEdit } from "lucide-react";
import styles from "@/app/progress/progress.module.css";

const CHECKPOINTS = [
  { day: 30, phase: PHASE_BOUNDS[0], title: "Foundation" },
  { day: 60, phase: PHASE_BOUNDS[1], title: "Build" },
  { day: 90, phase: PHASE_BOUNDS[2], title: "Final · Day 90" },
];

export function MilestoneView() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  if (!fh.hydrated) return null;

  const enrollment = persona.pmos?.enrollmentDay ?? "2026-01-01";
  const visits = getPlanTouchpoints(persona);
  const dayLog = readDayLog(persona.id);
  const bmi = bmiFrom(readHealthProfile(persona.id));

  return (
    <div className={styles.milestones}>
      {CHECKPOINTS.map((cp) => {
        const reached = fh.day >= cp.day;
        const { from, to } = cp.phase;
        const appts = visits.filter((v) => v.day >= from && v.day <= to);
        const act = phaseActivity(fh.done, from, to);
        const logs = logsInPhase(dayLog, enrollment, from, to);
        const markers = checkpointMarkers(persona, cp.day);
        return (
          <section key={cp.day} className={`${styles.cp} ${reached ? "" : styles.cpLocked}`}>
            <div className={styles.cpHead}>
              <span className={styles.cpIcon}>{reached ? <Trophy size={16} /> : <Lock size={15} />}</span>
              <div>
                <strong className={styles.cpTitle}>{cp.title}</strong>
                <span className={styles.cpSub}>Day {from}–{to}{reached ? "" : " · locked"}</span>
              </div>
            </div>

            {reached ? (
              <>
                <div className={styles.cpBlock}>
                  <span className={styles.cpLabel}>Appointments</span>
                  {appts.length ? (
                    appts.map((a) => (
                      <p key={`${a.day}-${a.service}`} className={styles.cpRow}>
                        {a.kind === "test" ? <FlaskConical size={13} /> : <Stethoscope size={13} />} Day {a.day} · {a.label}
                      </p>
                    ))
                  ) : (
                    <p className={styles.cpMuted}>None scheduled.</p>
                  )}
                </div>

                {markers.length > 0 && (
                  <div className={styles.cpBlock}>
                    <span className={styles.cpLabel}>Clinical markers</span>
                    {markers.map((m) => (
                      <p key={m.key} className={styles.cpRow}>
                        {m.label}: <strong className={styles.cpVal}>{m.value.toFixed(m.decimals)}{m.unit}</strong>
                        <span className={`${styles.cpState} ${m.state === "measured" ? styles.cpMeasured : ""}`}>{m.state}</span>
                      </p>
                    ))}
                  </div>
                )}

                <div className={styles.cpBlock}>
                  <span className={styles.cpLabel}>This phase</span>
                  <p className={styles.cpRow}><CheckCircle2 size={13} /> {act.tasks} tasks · {act.activeDays} active days</p>
                  <p className={styles.cpRow}><Droplet size={13} /> {logs.periods} period{logs.periods === 1 ? "" : "s"} · {logs.symptomDays} symptom-day{logs.symptomDays === 1 ? "" : "s"} logged</p>
                  <p className={styles.cpRow}><ClipboardEdit size={13} /> Health profile: {bmi ? `BMI ${bmi}` : "not updated"}</p>
                </div>

                {cp.day === 90 && (
                  <div className={styles.cpBlock}>
                    <span className={styles.cpLabel}>Day-90 re-test</span>
                    <p className={styles.cpRow}><FlaskConical size={13} /> Full panel — HbA1c, HOMA-IR, lipids, hormones</p>
                  </div>
                )}
              </>
            ) : (
              <p className={styles.cpPreview}>Reached at Day {cp.day}. Your markers, appointments and activity for this phase appear here.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
