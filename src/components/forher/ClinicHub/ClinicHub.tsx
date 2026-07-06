"use client";
import { useMemo, useState } from "react";
import { Video, Users, ClipboardEdit, Stethoscope, FlaskConical, Check } from "lucide-react";
import type { Persona } from "@/types/persona";
import type { CareTrack } from "@/types/journey";
import { clinicPlanFor, careCircleFlags, getCareCircle, type CareItem } from "@/lib/journey";
import { readHealthProfile, writeHealthProfile, bmiFrom, type HealthProfile } from "@/lib/forher/healthprofile";
import { readBookings, writeBookings, upsertBooking, isBooked, type Bookings } from "@/lib/forher/clinic";
import { BookingSheet } from "@/components/forher/BookingSheet/BookingSheet";
import { Sheet } from "@/components/forher/Sheet/Sheet";
import styles from "./ClinicHub.module.css";

type View = "visit" | "team" | "profile" | null;

const TIER_LEDE: Record<string, string> = {
  high: "Your screen points to a higher hormonal-health risk. Let's get you seen.",
  medium: "Your screen suggests a moderate hormonal-health risk worth checking.",
  low: "A couple of signals worth a light check-in.",
  none: "No risk signals right now — keep up your lifestyle habits.",
};

/** The Clinic hub: one primary action + Video visit / Care plan team / Health profile,
 *  each opening a sheet. Reused on /clinic (showRecommended) and in onboarding. */
export function ClinicHub({
  persona,
  tier,
  showRecommended = true,
}: {
  persona: Persona;
  tier: CareTrack;
  showRecommended?: boolean;
}) {
  const [profile, setProfile] = useState<HealthProfile>(() =>
    typeof window === "undefined" ? {} : readHealthProfile(persona.id),
  );
  const [bookings, setBookings] = useState<Bookings>(() =>
    typeof window === "undefined" ? {} : readBookings(persona.id),
  );
  const [view, setView] = useState<View>(null);
  const [sheetItem, setSheetItem] = useState<CareItem | null>(null);

  const flags = useMemo(() => careCircleFlags(persona, profile), [persona, profile]);
  const plan = useMemo(() => clinicPlanFor(tier, flags), [tier, flags]);
  const team = useMemo(() => getCareCircle(tier, flags), [tier, flags]);

  const allItems = useMemo(
    () => [plan.primary, ...plan.secondary].filter(Boolean) as CareItem[],
    [plan],
  );
  const consults = allItems.filter((i) => i.kind === "consult");
  const tests = allItems.filter((i) => i.kind === "test");
  const extraTests = tests.filter((t) => !(plan.primary && plan.primary.kind === "test" && plan.primary.id === t.id));

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
  const bookedCount = Object.keys(bookings).length;

  const MiniRow = ({ item }: { item: CareItem }) => {
    const booked = isBooked(bookings, item.id);
    const Icon = item.kind === "test" ? FlaskConical : Stethoscope;
    return (
      <div className={styles.row}>
        <span className={styles.rowIcon}>
          <Icon size={17} />
        </span>
        <div className={styles.rowBody}>
          <strong className={styles.rowTitle}>{item.label}</strong>
          <span className={styles.rowWhy}>{item.reason}</span>
        </div>
        {booked ? (
          <span className={styles.booked}>
            <Check size={14} aria-hidden /> Booked
          </span>
        ) : (
          <button
            type="button"
            className={styles.rowBook}
            onClick={() => {
              setView(null);
              setSheetItem(item);
            }}
            aria-label={`Book ${item.label}`}
          >
            Book
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.hub}>
      {/* Card 1 — Recommended now */}
      {showRecommended &&
        (plan.showBooking && plan.primary ? (
          <section className={styles.hero}>
            <span className={styles.heroEyebrow}>Recommended now</span>
            <div className={styles.heroMain}>
              <span className={styles.heroIcon}>
                {plan.primary.kind === "test" ? <FlaskConical size={22} /> : <Stethoscope size={22} />}
              </span>
              <div className={styles.heroBody}>
                <h3 className={styles.heroTitle}>{plan.primary.label}</h3>
                <p className={styles.heroWhy}>{plan.primary.reason}</p>
              </div>
            </div>
            {isBooked(bookings, plan.primary.id) ? (
              <span className={styles.heroBooked}>
                <Check size={16} aria-hidden /> Booked
              </span>
            ) : (
              <button type="button" className={styles.heroBook} onClick={() => setSheetItem(plan.primary!)}>
                Book now
              </button>
            )}
            {extraTests.length > 0 && (
              <div className={styles.heroTests}>
                <span className={styles.heroTestsLabel}>Recommended tests</span>
                {extraTests.map((t) => (
                  <MiniRow key={t.id} item={t} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className={styles.hero}>
            <span className={styles.heroEyebrow}>You&apos;re in great shape</span>
            <p className={styles.lifestyle}>{TIER_LEDE[tier]} A wellness check-in is here whenever you want one.</p>
          </section>
        ))}

      {/* Cards 2–4 — tiles that open sheets */}
      <div className={styles.tiles}>
        <button type="button" className={styles.tile} onClick={() => setView("visit")}>
          <span className={`${styles.tileIcon} ${styles.tVisit}`}>
            <Video size={22} />
          </span>
          <strong className={styles.tileTitle}>Video visit</strong>
          <span className={styles.tileMeta}>{bookedCount > 0 ? `${bookedCount} booked` : "Book a consult"}</span>
        </button>

        <button type="button" className={styles.tile} onClick={() => setView("team")}>
          <span className={`${styles.tileIcon} ${styles.tTeam}`}>
            <Users size={22} />
          </span>
          <strong className={styles.tileTitle}>Care plan team</strong>
          <span className={styles.tileMeta}>{team.length} people</span>
        </button>

        <button type="button" className={styles.tile} onClick={() => setView("profile")}>
          <span className={`${styles.tileIcon} ${styles.tProfile}`}>
            <ClipboardEdit size={22} />
          </span>
          <strong className={styles.tileTitle}>Health profile</strong>
          <span className={styles.tileMeta}>{bmi ? `BMI ${bmi}` : "Update"}</span>
        </button>
      </div>

      {/* Video visit sheet */}
      <Sheet open={view === "visit"} onClose={() => setView(null)} ariaLabel="Book a video visit">
        <h2 className={styles.sheetTitle}>Video visit</h2>
        <p className={styles.sheetSub}>Your health context is shared, so your clinician arrives informed.</p>
        <div className={styles.sheetList}>
          {consults.map((c) => (
            <MiniRow key={c.id} item={c} />
          ))}
        </div>
      </Sheet>

      {/* Care plan team sheet */}
      <Sheet open={view === "team"} onClose={() => setView(null)} ariaLabel="Your care plan team">
        <h2 className={styles.sheetTitle}>Care plan team</h2>
        <p className={styles.sheetSub}>The people who&apos;ll support you — humans make any clinical calls.</p>
        <div className={styles.sheetList}>
          {team.map((s) => (
            <div key={s.role} className={styles.member}>
              <strong>{s.label}</strong>
              <span>{s.reason}</span>
            </div>
          ))}
        </div>
      </Sheet>

      {/* Health profile sheet */}
      <Sheet open={view === "profile"} onClose={() => setView(null)} ariaLabel="Your health profile">
        <h2 className={styles.sheetTitle}>Health profile</h2>
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
      </Sheet>

      {/* Booking confirm */}
      <BookingSheet item={sheetItem} onConfirm={book} onClose={() => setSheetItem(null)} />
    </div>
  );
}
