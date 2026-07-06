"use client";
import { Stethoscope, FlaskConical, ArrowRight } from "lucide-react";
import type { CareTrack } from "@/types/journey";
import { clinicPlanFor, type CareItem } from "@/lib/journey";
import styles from "./Recommendations.module.css";

/** Onboarding step: the lean "what we recommend" screen — recommended tests +
 *  doctor appointments only. Informational; booking happens after enrolment. */
export function Recommendations({
  tier,
  flags,
  onContinue,
}: {
  tier: CareTrack;
  flags: { acneOrHirsutism: boolean; ttc: boolean; highMetabolic: boolean };
  onContinue: () => void;
}) {
  const plan = clinicPlanFor(tier, flags);
  const items = [plan.primary, ...plan.secondary].filter(Boolean) as CareItem[];
  const tests = items.filter((i) => i.kind === "test");
  const consults = items.filter((i) => i.kind === "consult");

  const Row = ({ item }: { item: CareItem }) => {
    const Icon = item.kind === "test" ? FlaskConical : Stethoscope;
    return (
      <div className={styles.row}>
        <span className={styles.rowIcon}>
          <Icon size={17} />
        </span>
        <div className={styles.rowBody}>
          <strong>{item.label}</strong>
          <span>{item.reason}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      <span className={styles.eyebrow}>What we recommend</span>
      <h2 className={styles.h2}>Here&apos;s what would help</h2>
      <p className={styles.lede}>Based on your screen — you can book these once you start your plan.</p>

      {tests.length > 0 && (
        <section className={styles.section}>
          <span className={styles.sectionLabel}>Recommended tests</span>
          <div className={styles.list}>
            {tests.map((t) => (
              <Row key={t.id} item={t} />
            ))}
          </div>
        </section>
      )}

      {consults.length > 0 && (
        <section className={styles.section}>
          <span className={styles.sectionLabel}>Doctor appointments</span>
          <div className={styles.list}>
            {consults.map((c) => (
              <Row key={c.id} item={c} />
            ))}
          </div>
        </section>
      )}

      <button type="button" className={styles.continue} onClick={onContinue}>
        Continue <ArrowRight size={16} />
      </button>
      <p className={styles.disclaimer}>
        This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.
      </p>
    </div>
  );
}
