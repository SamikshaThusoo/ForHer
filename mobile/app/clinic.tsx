import { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  Baby, Stethoscope, FlaskConical, Check, X, Video, CalendarCheck, ClipboardEdit, RefreshCw,
  ChevronDown, AlertCircle, type LucideIcon,
} from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { usePersona } from "@/context/PersonaContext";
import {
  personaTrack, clinicPlanFor, careCircleFlags, careItemIncludes, getPlanTouchpoints, serviceForItem, type CareItem,
} from "@/lib/journey";
import { useForHer, readCycleLog, saveCycleLog } from "@/lib/forher/state";
import { activeConditions } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { readHealthProfile, writeHealthProfile, bmiFrom, type HealthProfile } from "@/lib/forher/healthprofile";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { readBookings, writeBookings, upsertBooking, isBooked, type Bookings } from "@/lib/forher/clinic";
import { colors, fonts } from "@/theme/tokens";

const TIER_COPY: Record<string, string> = {
  high: "Your screen points to a higher hormonal-health risk. Let's get you seen.",
  medium: "Your screen suggests a moderate hormonal-health risk worth checking.",
  low: "A couple of signals worth a light check-in.",
  none: "No risk signals right now — keep up your lifestyle habits.",
};

type SheetView = "visit" | "bookings" | "profile" | null;

// Compact chips for the collapsed "what we've noticed" summary line.
const FLAG_LABEL: Record<string, string> = {
  irregular: "irregular cycles",
  "missed-period": "a missed period",
  symptom: "logged symptoms",
};

export default function Clinic() {
  const router = useRouter();
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const tier = personaTrack(persona);
  const day = fh.day;

  const [cycleLog, setCycleLog] = useState(() => readCycleLog(persona.id));
  const [bookings, setBookings] = useState<Bookings>(() => readBookings(persona.id));
  const [profile, setProfile] = useState<HealthProfile>(() => readHealthProfile(persona.id));
  const [view, setView] = useState<SheetView>(null);
  const [sheetItem, setSheetItem] = useState<CareItem | null>(null);
  const [showNoticed, setShowNoticed] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const conditions = activeConditions({
    persona, cycleLog, dayLog: readDayLog(persona.id),
    cycleLength: cycleLengthFor(persona, cycleLog?.cycleLength), today: new Date(),
  });
  const hasConditions = conditions.length > 0;
  const condition = conditions[0] ?? null;
  const missedTrack = conditions.some((c) => c.type === "missed-period") && cycleLog?.intent === "track";

  const flags = useMemo(() => careCircleFlags(persona, profile, cycleLog), [persona, profile, cycleLog]);
  const plan = useMemo(() => clinicPlanFor(tier, flags), [tier, flags]);
  const visits = useMemo(() => getPlanTouchpoints(persona), [persona]);
  const allItems = [plan.primary, ...plan.secondary].filter(Boolean) as CareItem[];
  const consults = allItems.filter((i) => i.kind === "consult");
  const tests = allItems.filter((i) => i.kind === "test");
  const extraTests = tests.filter((t) => !(plan.primary && plan.primary.kind === "test" && plan.primary.id === t.id));
  const checkInItem: CareItem | null =
    !plan.showBooking && condition ? { id: "doctor", kind: "consult", label: "Book a check-in", reason: condition.body } : null;

  const bmi = bmiFrom(profile);
  const bookingList = Object.values(bookings);
  const bookedCount = bookingList.length;
  const bookedServices = new Set(bookingList.map((b) => serviceForItem(b.itemId)));
  const scheduledServices = new Set(visits.map((v) => v.service));
  const extras = bookingList.filter((b) => !scheduledServices.has(serviceForItem(b.itemId)));
  const todayVisit = visits.find((v) => v.day === day);
  const nextVisit = visits.find((v) => v.day > day);
  const shownVisits = visits.filter((v) => v === todayVisit || v === nextVisit || bookedServices.has(v.service));
  const planSlotFor = (item: CareItem) => {
    const d = visits.find((v) => v.service === serviceForItem(item.id))?.day;
    return d ? `Day ${d} of your 90-day plan` : "Added to your plan";
  };

  const setTtc = () => {
    if (!cycleLog) return;
    const next = { ...cycleLog, intent: "ttc" as const };
    saveCycleLog(persona.id, next); setCycleLog(next);
    const p = { ...readHealthProfile(persona.id), ttc: true };
    writeHealthProfile(persona.id, p); setProfile(p);
  };
  const patch = (p: Partial<HealthProfile>) => setProfile((prev) => { const n = { ...prev, ...p }; writeHealthProfile(persona.id, n); return n; });
  const isTtc = cycleLog?.intent === "ttc" || !!profile.ttc;
  const toggleTtc = () => {
    const next = !isTtc;
    patch({ ttc: next });
    if (cycleLog && cycleLog.intent !== "pregnant") {
      const cl = { ...cycleLog, intent: (next ? "ttc" : "track") as "ttc" | "track" };
      saveCycleLog(persona.id, cl); setCycleLog(cl);
    }
  };
  const book = (item: CareItem, slot: string) => {
    const next = upsertBooking(bookings, { itemId: item.id, kind: item.kind, label: item.label, slot, bookedAt: new Date().toISOString() });
    setBookings(next); writeBookings(persona.id, next); setSheetItem(null);
  };

  const MiniRow = ({ item }: { item: CareItem }) => {
    const booked = isBooked(bookings, item.id);
    const Icon = item.kind === "test" ? FlaskConical : Stethoscope;
    return (
      <View style={styles.row}>
        <View style={styles.rowIcon}><Icon size={17} color="#B5532F" /></View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{item.label}</Text>
          <Text style={styles.rowWhy}>{item.reason}</Text>
        </View>
        {booked
          ? <View style={styles.bookedTag}><Check size={14} color="#4F9D69" /><Text style={styles.bookedText}>Booked</Text></View>
          : <PressableScale onPress={() => { setView(null); setSheetItem(item); }} style={styles.rowBook}><Text style={styles.rowBookText}>Book</Text></PressableScale>}
      </View>
    );
  };

  const primaryHero = (item: CareItem, extra: CareItem[]) => {
    const HeroIcon = item.kind === "test" ? FlaskConical : Stethoscope;
    return (
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Recommended for you</Text>
        <View style={styles.heroMain}>
          <View style={styles.heroIcon}><HeroIcon size={22} color="#B5532F" /></View>
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>{item.label}</Text>
            <Text style={styles.heroWhy}>{item.reason}</Text>
          </View>
        </View>
        {/* One clear primary action. The "what's included" detail lives in the booking sheet. */}
        {isBooked(bookings, item.id)
          ? <View style={styles.heroBooked}><Check size={16} color="#4F9D69" /><Text style={styles.heroBookedText}>Booked</Text></View>
          : <PressableScale onPress={() => setSheetItem(item)} style={styles.heroBook}><Text style={styles.heroBookText}>Book now</Text></PressableScale>}
        {extra.length > 0 && (
          <View style={styles.heroTests}>
            <PressableScale onPress={() => setShowTests((s) => !s)} style={styles.testsToggle}>
              <Text style={styles.heroTestsLabel}>{showTests ? "Recommended tests" : `See ${extra.length} recommended test${extra.length > 1 ? "s" : ""}`}</Text>
              <ChevronDown size={15} color={colors.plumBright} style={{ transform: [{ rotate: showTests ? "180deg" : "0deg" }] }} />
            </PressableScale>
            {showTests && extra.map((t) => <MiniRow key={t.id} item={t} />)}
          </View>
        )}
      </View>
    );
  };

  const tiles: { view: SheetView; Icon: LucideIcon; tint: { bg: string; fg: string }; title: string; meta: string }[] = [
    { view: "visit", Icon: Video, tint: { bg: "rgba(181,83,47,0.13)", fg: "#B5532F" }, title: "Video visit", meta: bookedCount > 0 ? `${bookedCount} booked` : "Book a consult" },
    { view: "bookings", Icon: CalendarCheck, tint: { bg: "rgba(142,83,120,0.13)", fg: "#8E5378" }, title: "Your bookings", meta: bookedCount > 0 ? `${bookedCount} booked` : shownVisits.length ? `${shownVisits.length} scheduled` : "None yet" },
    { view: "profile", Icon: ClipboardEdit, tint: { bg: "rgba(47,122,122,0.12)", fg: "#2F7A7A" }, title: "Health profile", meta: bmi ? `BMI ${bmi}` : "Update" },
  ];

  return (
    <Screen>
      <Header title="Clinic" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Clinic ForHer</Text>
        <Text style={styles.h1}>{hasConditions ? "Let's look into this" : "Your next step"}</Text>
        <Text style={styles.lede}>{hasConditions ? "Here's what your tracking has flagged — and what a check-in can do about it." : TIER_COPY[tier]}</Text>
      </View>

      {hasConditions && (
        <View style={styles.noticed}>
          <PressableScale onPress={() => setShowNoticed((s) => !s)} style={styles.noticedHead}>
            <AlertCircle size={15} color="#A34E5E" />
            <Text style={styles.noticedSummary} numberOfLines={1}>
              Flagged: {conditions.map((c) => FLAG_LABEL[c.type] ?? c.type).join(", ")}
            </Text>
            <ChevronDown size={16} color="#A34E5E" style={{ transform: [{ rotate: showNoticed ? "180deg" : "0deg" }] }} />
          </PressableScale>
          {showNoticed && conditions.map((c) => (
            <View key={c.type} style={styles.noticedItem}>
              <Text style={styles.noticedTitle}>{c.title}</Text>
              <Text style={styles.noticedBody}>{c.body}</Text>
            </View>
          ))}
        </View>
      )}

      {missedTrack && (
        <View style={styles.intent}>
          <View style={styles.intentIcon}><Baby size={18} color={colors.plumBright} /></View>
          <View style={styles.intentBody}>
            <Text style={styles.intentTitle}>Trying to conceive?</Text>
            <Text style={styles.intentSub}>A long gap can also mean you&apos;re trying for a baby — telling us changes what we look for.</Text>
          </View>
          <PressableScale onPress={setTtc} style={styles.intentBtn}><Text style={styles.intentBtnText}>Yes, I am</Text></PressableScale>
        </View>
      )}

      {/* Card 1 — Recommended now */}
      <View style={styles.hub}>
        {plan.showBooking && plan.primary
          ? primaryHero(plan.primary, extraTests)
          : checkInItem
            ? primaryHero(checkInItem, [])
            : (
              <View style={styles.heroCard}>
                <Text style={styles.heroEyebrow}>You&apos;re in great shape</Text>
                <Text style={styles.lifestyle}>{TIER_COPY[tier]} A wellness check-in is here whenever you want one.</Text>
              </View>
            )}

        {/* Cards 2–4 — tiles */}
        <View style={styles.tiles}>
          {tiles.map((t) => (
            <PressableScale key={t.title} onPress={() => setView(t.view)} style={styles.tile}>
              <View style={[styles.tileIcon, { backgroundColor: t.tint.bg }]}><t.Icon size={22} color={t.tint.fg} /></View>
              <Text style={styles.tileTitle}>{t.title}</Text>
              <Text style={styles.tileMeta}>{t.meta}</Text>
            </PressableScale>
          ))}
        </View>
      </View>

      <PressableScale onPress={() => router.push("/for-her")} style={styles.recheck}>
        <RefreshCw size={13} color={colors.plumBright} /><Text style={styles.recheckText}>Re-check your PMOS risk</Text>
      </PressableScale>

      <Text style={styles.disclaimer}>This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.</Text>

      {/* Video visit sheet */}
      <Sheet open={view === "visit"} onClose={() => setView(null)}>
        <Text style={styles.sheetTitle}>Video visit</Text>
        <Text style={styles.sheetSub}>Your health context is shared, so your clinician arrives informed.</Text>
        {consults.map((c) => <MiniRow key={c.id} item={c} />)}
      </Sheet>

      {/* Your bookings sheet */}
      <Sheet open={view === "bookings"} onClose={() => setView(null)}>
        <Text style={styles.sheetTitle}>Your bookings</Text>
        <Text style={styles.sheetSub}>What&apos;s next on your 90-day plan — you&apos;re on Day {day}. Prototype, no real appointment is booked.</Text>
        {shownVisits.length === 0 && extras.length === 0 ? (
          <Text style={styles.empty}>Nothing coming up. Book from &ldquo;Recommended now&rdquo; or &ldquo;Video visit&rdquo;.</Text>
        ) : (
          <>
            {shownVisits.map((v) => {
              const Icon = v.kind === "test" ? FlaskConical : Stethoscope;
              const booked = bookedServices.has(v.service);
              const isTodayV = v.day === day;
              return (
                <View key={`${v.day}-${v.service}`} style={[styles.row, isTodayV && styles.rowToday]}>
                  <View style={styles.dayChip}><Text style={styles.dayChipText}>Day {v.day}</Text></View>
                  <View style={styles.rowIcon}><Icon size={17} color="#B5532F" /></View>
                  <View style={styles.rowBody}><Text style={styles.rowTitle}>{v.label}</Text></View>
                  {booked ? <View style={styles.bookedTag}><Check size={14} color="#4F9D69" /><Text style={styles.bookedText}>Booked</Text></View>
                    : isTodayV ? <View style={styles.todayTag}><Text style={styles.todayTagText}>Today</Text></View>
                    : v.day < day ? <Text style={styles.inPlan}>Passed</Text>
                    : <Text style={styles.inPlan}>In {v.day - day}d</Text>}
                </View>
              );
            })}
            {extras.map((bk) => {
              const Icon = bk.kind === "test" ? FlaskConical : Stethoscope;
              return (
                <View key={bk.itemId} style={styles.row}>
                  <View style={styles.rowIcon}><Icon size={17} color="#B5532F" /></View>
                  <View style={styles.rowBody}><Text style={styles.rowTitle}>{bk.label}</Text><Text style={styles.rowWhy}>{bk.slot}</Text></View>
                  <View style={styles.bookedTag}><Check size={14} color="#4F9D69" /><Text style={styles.bookedText}>Booked</Text></View>
                </View>
              );
            })}
          </>
        )}
      </Sheet>

      {/* Health profile sheet */}
      <Sheet open={view === "profile"} onClose={() => setView(null)}>
        <Text style={styles.sheetTitle}>Health profile</Text>
        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Height (cm)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={profile.heightCm ? String(profile.heightCm) : ""}
              onChangeText={(t) => patch({ heightCm: t ? Number(t) : undefined })} placeholder="—" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Weight (kg)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={profile.weightKg ? String(profile.weightKg) : ""}
              onChangeText={(t) => patch({ weightKg: t ? Number(t) : undefined })} placeholder="—" placeholderTextColor={colors.textMuted} />
          </View>
        </View>
        <Text style={styles.bmi}>{bmi ? `BMI ${bmi} · shared with your care team for review` : "Add height + weight to see your BMI"}</Text>
        <View style={styles.toggles}>
          {([
            { on: isTtc, label: "Trying to conceive", press: toggleTtc },
            { on: !!profile.skinHairChanges, label: "Skin or hair changes", press: () => patch({ skinHairChanges: !profile.skinHairChanges }) },
            { on: !!profile.everPregnant, label: "Been pregnant before", press: () => patch({ everPregnant: !profile.everPregnant }) },
          ]).map((t) => (
            <PressableScale key={t.label} onPress={t.press} style={[styles.toggle, t.on && styles.toggleOn]}>
              <Text style={[styles.toggleText, t.on && styles.toggleTextOn]}>{t.label}</Text>
            </PressableScale>
          ))}
        </View>
        <Text style={styles.hint}>Trying-to-conceive and skin/hair changes adjust your care circle. Height, weight and history are shared for your care team to review at your next visit.</Text>
      </Sheet>

      {/* Booking confirm sheet */}
      <Sheet open={!!sheetItem} onClose={() => setSheetItem(null)}>
        {sheetItem && (
          <>
            <Text style={styles.sheetTitle}>Book {sheetItem.label}</Text>
            <Text style={styles.sheetSub}>{sheetItem.reason}</Text>
            <Text style={styles.heroTestsLabel}>What&apos;s included</Text>
            {careItemIncludes(sheetItem.id).map((line, i) => (
              <View key={i} style={styles.heroInclude}><Check size={13} color="#4F9D69" strokeWidth={2.5} /><Text style={styles.heroIncludeText}>{line}</Text></View>
            ))}
            <View style={styles.slotBox}><CalendarCheck size={15} color={colors.plumBright} /><Text style={styles.slotText}>{planSlotFor(sheetItem)}</Text></View>
            <PressableScale onPress={() => book(sheetItem, planSlotFor(sheetItem))} style={styles.confirm}><Text style={styles.confirmText}>Confirm booking</Text></PressableScale>
            <Text style={styles.sheetNote}>Prototype — no real appointment is scheduled.</Text>
          </>
        )}
      </Sheet>
    </Screen>
  );
}

function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grab} />
          <Pressable onPress={onClose} style={styles.sheetClose}><X size={18} color={colors.textSoft} /></Pressable>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 6 },
  eyebrow: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep, marginTop: 4 },
  lede: { fontSize: 13, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 19 },

  noticed: { marginHorizontal: 18, marginTop: 10, backgroundColor: "rgba(199,107,122,0.06)", borderWidth: 1, borderColor: "rgba(199,107,122,0.2)", borderRadius: 15, paddingVertical: 12, paddingHorizontal: 14 },
  noticedHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  noticedSummary: { flex: 1, fontSize: 12.5, fontFamily: fonts.sansBold, color: "#A34E5E" },
  noticedItem: { marginTop: 10 },
  noticedTitle: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  noticedBody: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 18 },

  intent: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 18, marginTop: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 13 },
  intentIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)" },
  intentBody: { flex: 1 },
  intentTitle: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  intentSub: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 16 },
  intentBtn: { backgroundColor: colors.plum, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  intentBtnText: { color: "#fff", fontSize: 12, fontFamily: fonts.sansBold },

  hub: { paddingHorizontal: 18, marginTop: 12, gap: 11 },
  heroCard: { backgroundColor: "#FBEFE6", borderWidth: 1, borderColor: "rgba(181,83,47,0.14)", borderRadius: 20, padding: 16, shadowColor: "#5B2A4A", shadowOpacity: 0.1, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  heroEyebrow: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: "#B5532F" },
  heroMain: { flexDirection: "row", gap: 12, marginVertical: 12 },
  heroIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(181,83,47,0.14)" },
  heroBody: { flex: 1 },
  heroTitle: { fontSize: 18, fontFamily: fonts.serif, color: colors.plumDeep },
  heroWhy: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 3, lineHeight: 17 },
  heroInclude: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginBottom: 6 },
  heroIncludeText: { flex: 1, fontSize: 12, fontFamily: fonts.sans, color: colors.plum, lineHeight: 16 },
  heroBook: { backgroundColor: colors.plum, borderRadius: 13, paddingVertical: 12, alignItems: "center" },
  heroBookText: { color: "#fff", fontSize: 14, fontFamily: fonts.sansBold },
  heroBooked: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, backgroundColor: "rgba(79,157,105,0.1)", borderRadius: 13 },
  heroBookedText: { fontSize: 13.5, fontFamily: fonts.sansBold, color: "#4F9D69" },
  heroTests: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(181,83,47,0.14)" },
  testsToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 4 },
  heroTestsLabel: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.plumBright },
  lifestyle: { fontSize: 13.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 8, lineHeight: 20 },

  tiles: { flexDirection: "row", gap: 10 },
  tile: { flex: 1, minHeight: 138, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(91,42,74,0.08)", borderRadius: 18, padding: 12, paddingVertical: 14, shadowColor: "#5B2A4A", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  tileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tileTitle: { marginTop: "auto", fontSize: 13, fontFamily: fonts.sansBold, color: colors.plumDeep, lineHeight: 16 },
  tileMeta: { fontSize: 11, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 14 },

  recheck: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, alignSelf: "center", paddingVertical: 8, paddingHorizontal: 14 },
  recheckText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.plumBright },
  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginHorizontal: 22, marginTop: 8, lineHeight: 14 },

  row: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(91,42,74,0.07)" },
  rowToday: { backgroundColor: "rgba(181,83,47,0.07)", borderRadius: 10, paddingHorizontal: 8, marginHorizontal: -8 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(181,83,47,0.12)" },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 13.5, fontFamily: fonts.sansMedium, color: colors.plumDeep },
  rowWhy: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 1, lineHeight: 15 },
  rowBook: { backgroundColor: colors.plum, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 15 },
  rowBookText: { color: "#fff", fontSize: 12.5, fontFamily: fonts.sansBold },
  bookedTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  bookedText: { fontSize: 12, fontFamily: fonts.sansBold, color: "#4F9D69" },
  todayTag: { backgroundColor: "rgba(181,83,47,0.14)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  todayTagText: { fontSize: 11, fontFamily: fonts.sansBold, color: "#B5532F" },
  inPlan: { fontSize: 11.5, fontFamily: fonts.sansMedium, color: colors.textMuted },
  dayChip: { backgroundColor: "rgba(142,83,120,0.1)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  dayChipText: { fontSize: 10.5, fontFamily: fonts.sansBold, color: colors.plumBright },

  scrim: { flex: 1, backgroundColor: "rgba(62,27,51,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FBF3F5", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 28 },
  grab: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(91,42,74,0.2)", marginBottom: 10 },
  sheetClose: { position: "absolute", right: 14, top: 14, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, zIndex: 2 },
  sheetTitle: { fontSize: 21, fontFamily: fonts.serif, color: colors.plumDeep, paddingRight: 34 },
  sheetSub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 4, marginBottom: 12, lineHeight: 18 },
  empty: { fontSize: 13, fontFamily: fonts.sans, color: colors.textSoft, paddingVertical: 14, lineHeight: 19 },

  fields: { flexDirection: "row", gap: 10, marginTop: 4 },
  field: { flex: 1, gap: 5 },
  fieldLabel: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.plumBright },
  input: { borderWidth: 1, borderColor: "rgba(91,42,74,0.18)", borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12, fontSize: 14, fontFamily: fonts.sansMedium, color: colors.text, backgroundColor: "#fff" },
  bmi: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 10, marginBottom: 14 },
  toggles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toggle: { backgroundColor: "rgba(142,83,120,0.07)", borderWidth: 1, borderColor: "rgba(142,83,120,0.2)", borderRadius: 12, paddingVertical: 9, paddingHorizontal: 13 },
  toggleOn: { backgroundColor: colors.plum, borderColor: colors.plum },
  toggleText: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.plum },
  toggleTextOn: { color: "#fff" },
  hint: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 12, lineHeight: 16 },

  slotBox: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 12, backgroundColor: "rgba(142,83,120,0.08)", borderRadius: 12, padding: 12 },
  slotText: { flex: 1, fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  confirm: { backgroundColor: colors.plum, borderRadius: 13, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  confirmText: { color: "#fff", fontSize: 14.5, fontFamily: fonts.sansBold },
  sheetNote: { fontSize: 10, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginTop: 8 },
});
