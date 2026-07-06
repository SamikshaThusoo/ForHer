"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Stethoscope, FlaskConical, Check, Users, ClipboardEdit } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { getClinicPlan, getCareCircle, careCircleFlags, type CareItem } from "@/lib/journey";
import { readHealthProfile, writeHealthProfile, bmiFrom, type HealthProfile } from "@/lib/forher/healthprofile";
import { readBookings, writeBookings, upsertBooking, isBooked, type Bookings } from "@/lib/forher/clinic";
import { BookingSheet } from "@/components/forher/BookingSheet/BookingSheet";
import styles from "./ClinicForHer.module.css";

const TIER_COPY: Record<string, string> = {
  high: "Your screen points to a higher hormonal-health risk. Let's get you seen.",
  medium: "Your screen suggests a moderate hormonal-health risk worth checking.",
  low: "A couple of signals worth a light check-in.",
  none: "No risk signals right now — you're in great shape.",
};

export function ClinicForHer() {
  const { persona } = usePersona();
  const [profile, setProfile] = useState<HealthProfile>(() =>
    typeof window === "undefined" ? {} : readHealthProfile(persona.id),
  );
  const [bookings, setBookings] = useState<Bookings>(() =>
    typeof window === "undefined" ? {} : readBookings(persona.id),
  );
  const [sheetItem, setSheetItem] = useState<CareItem | null>(null);

  const plan = useMemo(() => getClinicPlan(persona, profile), [persona, profile]);
  const team = useMemo(
    () => getCareCircle(plan.tier, careCircleFlags(persona, profile)),
    [persona, profile, plan.tier],
  );

  const book = (item: CareItem, slot: string) => {
    setBookings((prev) => {
      const next = upsertBooking(prev, {
        itemId: item.id,
        kind: item.kind,
        label: item.label,
        slot,
        bookedAt: new Date().toISOString(),
      });
      writeBookings(persona.id, next);
      return next;
    });
    setSheetItem(null);
  };

  const patch = (p: Partial<HealthProfile>) =>
    setProfile((prev) => {
      const next = { ...prev, ...p };
      writeHealthProfile(persona.id, next);
      return next;
    });

  const bmi = bmiFrom(profile);

  const Card = ({ item }: { item: CareItem }) => {
    const booked = isBooked(bookings, item.id);
    const Icon = item.kind === "test" ? FlaskConical : Stethoscope;
    return (
      <div className={`${styles.item} ${item.priority ? styles.itemPriority : ""}`}>
        <span className={styles.itemIcon}>
          <Icon size={20} />
        </span>
        <div className={styles.itemBody}>
          <h3 className={styles.itemTitle}>{item.label}</h3>
          <p className={styles.itemWhy}>{item.reason}</p>
        </div>
        {booked ? (
          <span className={styles.booked}>
            <Check size={15} aria-hidden /> Booked
          </span>
        ) : (
          <button
            type="button"
            className={styles.bookBtn}
            onClick={() => setSheetItem(item)}
            aria-label={`Book ${item.label}`}
          >
            Book
          </button>
        )}
      </div>
    );
  };

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.header}>
        <Link href="/" className={styles.back} aria-label="Back to home">
          <ChevronLeft size={20} />
        </Link>
        <span className={styles.brand}>Clinic</span>
      </header>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>ClinicForHer</span>
        <h1 className={styles.h1}>Your next step</h1>
        <p className={styles.lede}>{TIER_COPY[plan.tier]}</p>
      </section>

      {plan.showBooking ? (
        <>
          {plan.primary && (
            <section className={styles.section}>
              <span className={styles.sectionLabel}>Recommended now</span>
              <div className={styles.primary}>
                <Card item={plan.primary} />
              </div>
            </section>
          )}

          {plan.secondary.length > 0 && (
            <section className={styles.section}>
              <span className={styles.sectionLabel}>Your care circle</span>
              <div className={styles.list}>
                {plan.secondary.map((i) => (
                  <Card key={`${i.kind}:${i.id}`} item={i} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className={styles.section}>
          <div className={styles.lifestyle}>
            <p>Keep up your lifestyle habits and cycle tracking. A wellness check-in is here whenever you want one.</p>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <span className={styles.sectionLabel}>
          <Users size={13} aria-hidden /> Your care team
        </span>
        <div className={styles.team}>
          {team.map((s) => (
            <div key={s.role} className={styles.member}>
              <strong>{s.label}</strong>
              <span>{s.reason}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.sectionLabel}>
          <ClipboardEdit size={13} aria-hidden /> Health profile
        </span>
        <div className={styles.profile}>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Height (cm)</span>
              <input
                type="number"
                inputMode="numeric"
                min={100}
                max={220}
                value={profile.heightCm ?? ""}
                onChange={(e) => patch({ heightCm: e.target.value ? Number(e.target.value) : undefined })}
              />
            </label>
            <label className={styles.field}>
              <span>Weight (kg)</span>
              <input
                type="number"
                inputMode="numeric"
                min={30}
                max={200}
                value={profile.weightKg ?? ""}
                onChange={(e) => patch({ weightKg: e.target.value ? Number(e.target.value) : undefined })}
              />
            </label>
          </div>
          <p className={styles.bmi}>
            {bmi ? `BMI ${bmi} · shared with your care team for review` : "Add height + weight to see your BMI"}
          </p>
          <div className={styles.toggles}>
            <button
              type="button"
              className={`${styles.toggle} ${profile.ttc ? styles.toggleOn : ""}`}
              aria-pressed={!!profile.ttc}
              onClick={() => patch({ ttc: !profile.ttc })}
            >
              Trying to conceive
            </button>
            <button
              type="button"
              className={`${styles.toggle} ${profile.skinHairChanges ? styles.toggleOn : ""}`}
              aria-pressed={!!profile.skinHairChanges}
              onClick={() => patch({ skinHairChanges: !profile.skinHairChanges })}
            >
              Skin or hair changes
            </button>
            <button
              type="button"
              className={`${styles.toggle} ${profile.everPregnant ? styles.toggleOn : ""}`}
              aria-pressed={!!profile.everPregnant}
              onClick={() => patch({ everPregnant: !profile.everPregnant })}
            >
              Been pregnant before
            </button>
          </div>
          <p className={styles.hint}>
            Trying-to-conceive and skin/hair changes adjust your care circle. Height, weight and history are shared for
            your care team to review at your next visit.
          </p>
        </div>
      </section>

      <p className={styles.disclaimer}>
        This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.
      </p>

      <BookingSheet item={sheetItem} onConfirm={book} onClose={() => setSheetItem(null)} />
    </main>
  );
}
