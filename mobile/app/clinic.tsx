import { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { Baby, Stethoscope, FlaskConical, Check, X, Calendar } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { usePersona } from "@/context/PersonaContext";
import { personaTrack, clinicPlanFor, careItemIncludes, careCircleFlags, type CareItem } from "@/lib/journey";
import { useForHer, readCycleLog, saveCycleLog } from "@/lib/forher/state";
import { activeConditions } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { readHealthProfile, writeHealthProfile } from "@/lib/forher/healthprofile";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { readBookings, writeBookings, upsertBooking, isBooked, PLACEHOLDER_SLOTS, type Bookings } from "@/lib/forher/clinic";
import { colors, fonts } from "@/theme/tokens";

const TIER_COPY: Record<string, string> = {
  high: "Your screen points to a higher hormonal-health risk. Let's get you seen.",
  medium: "Your screen suggests a moderate hormonal-health risk worth checking.",
  low: "A couple of signals worth a light check-in.",
  none: "No risk signals right now — keep up your lifestyle habits.",
};

export default function Clinic() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const tier = personaTrack(persona);
  const [cycleLog, setCycleLog] = useState(() => readCycleLog(persona.id));
  const [bookings, setBookings] = useState<Bookings>(() => readBookings(persona.id));
  const [bookingItem, setBookingItem] = useState<CareItem | null>(null);

  const conditions = activeConditions({
    persona, cycleLog, dayLog: readDayLog(persona.id),
    cycleLength: cycleLengthFor(persona, cycleLog?.cycleLength), today: new Date(),
  });
  const hasConditions = conditions.length > 0;
  const missedTrack = conditions.some((c) => c.type === "missed-period") && cycleLog?.intent === "track";

  const flags = careCircleFlags(persona, readHealthProfile(persona.id), cycleLog);
  const plan = clinicPlanFor(tier, flags);
  const items = [plan.primary, ...plan.secondary].filter(Boolean) as CareItem[];

  const setTtc = () => {
    if (!cycleLog) return;
    const next = { ...cycleLog, intent: "ttc" as const };
    saveCycleLog(persona.id, next); setCycleLog(next);
    writeHealthProfile(persona.id, { ...readHealthProfile(persona.id), ttc: true });
  };

  const confirmBooking = (item: CareItem, slot: string) => {
    const next = upsertBooking(bookings, { itemId: item.id, kind: item.kind, label: item.label, slot, bookedAt: new Date().toISOString() });
    setBookings(next); writeBookings(persona.id, next); setBookingItem(null);
  };

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
          <Text style={styles.noticedLabel}>What we&apos;ve noticed</Text>
          {conditions.map((c) => (
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

      {items.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          {items.map((item) => {
            const Icon = item.kind === "test" ? FlaskConical : Stethoscope;
            const booked = isBooked(bookings, item.id);
            return (
              <View key={item.id} style={styles.careCard}>
                <View style={styles.careTop}>
                  <View style={styles.careIcon}><Icon size={20} color={colors.plumBright} /></View>
                  <View style={styles.careBody}>
                    <Text style={styles.careLabel}>{item.label}</Text>
                    <Text style={styles.careReason}>{item.reason}</Text>
                  </View>
                </View>
                {booked ? (
                  <View style={styles.bookedRow}>
                    <Check size={14} color="#4F9D69" strokeWidth={3} />
                    <Text style={styles.bookedText}>Booked · {bookings[item.id].slot}</Text>
                  </View>
                ) : (
                  <PressableScale onPress={() => setBookingItem(item)} style={styles.bookBtn}>
                    <Calendar size={14} color="#fff" /><Text style={styles.bookBtnText}>Book</Text>
                  </PressableScale>
                )}
              </View>
            );
          })}
        </>
      )}

      <Text style={styles.disclaimer}>This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.</Text>

      {/* Booking confirm sheet */}
      <Modal visible={!!bookingItem} transparent animationType="slide" onRequestClose={() => setBookingItem(null)}>
        <Pressable style={styles.scrim} onPress={() => setBookingItem(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grab} />
            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Book {bookingItem?.label}</Text>
              <Pressable onPress={() => setBookingItem(null)} style={styles.close}><X size={18} color={colors.textSoft} /></Pressable>
            </View>
            {bookingItem && (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.sheetReason}>{bookingItem.reason}</Text>
                <Text style={styles.includesLabel}>What&apos;s included</Text>
                {careItemIncludes(bookingItem.id).map((line, i) => (
                  <View key={i} style={styles.includeRow}><Check size={13} color={colors.plumBright} strokeWidth={2.5} /><Text style={styles.includeText}>{line}</Text></View>
                ))}
                <View style={styles.slotBox}>
                  <Calendar size={15} color={colors.plumBright} />
                  <Text style={styles.slotText}>{PLACEHOLDER_SLOTS[bookingItem.kind]}</Text>
                </View>
              </ScrollView>
            )}
            <Pressable onPress={() => bookingItem && confirmBooking(bookingItem, PLACEHOLDER_SLOTS[bookingItem.kind])} style={styles.confirm}>
              <Text style={styles.confirmText}>Confirm booking</Text>
            </Pressable>
            <Text style={styles.sheetNote}>Prototype — no real appointment is scheduled.</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 6 },
  eyebrow: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep, marginTop: 4 },
  lede: { fontSize: 13, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 19 },

  noticed: { marginHorizontal: 18, marginTop: 8, backgroundColor: "rgba(199,107,122,0.06)", borderWidth: 1, borderColor: "rgba(199,107,122,0.2)", borderRadius: 15, padding: 14 },
  noticedLabel: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: "#A34E5E", marginBottom: 8 },
  noticedItem: { marginBottom: 8 },
  noticedTitle: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  noticedBody: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 18 },

  intent: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 18, marginTop: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 13 },
  intentIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)" },
  intentBody: { flex: 1 },
  intentTitle: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  intentSub: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 16 },
  intentBtn: { backgroundColor: colors.plum, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  intentBtnText: { color: "#fff", fontSize: 12, fontFamily: fonts.sansBold },

  sectionTitle: { fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.textMuted, marginHorizontal: 20, marginTop: 22, marginBottom: 10 },
  careCard: { marginHorizontal: 18, marginBottom: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 14, gap: 12 },
  careTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  careIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)" },
  careBody: { flex: 1 },
  careLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.plumDeep },
  careReason: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 17 },
  bookBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: colors.plum, borderRadius: 11, paddingVertical: 11 },
  bookBtnText: { color: "#fff", fontSize: 13, fontFamily: fonts.sansBold },
  bookedRow: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(79,157,105,0.1)", borderRadius: 11, paddingVertical: 10, paddingHorizontal: 12 },
  bookedText: { fontSize: 12, fontFamily: fonts.sansBold, color: "#3E7A54" },

  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginHorizontal: 22, marginTop: 22, lineHeight: 14 },

  scrim: { flex: 1, backgroundColor: "rgba(62,27,51,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FBF3F5", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, paddingBottom: 28 },
  grab: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(91,42,74,0.2)", marginBottom: 12 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sheetTitle: { flex: 1, fontSize: 18, fontFamily: fonts.serif, color: colors.plumDeep },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line },
  sheetReason: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, lineHeight: 18 },
  includesLabel: { fontSize: 10.5, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.textMuted, marginTop: 14, marginBottom: 6 },
  includeRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  includeText: { flex: 1, fontSize: 12.5, fontFamily: fonts.sans, color: colors.plumDeep, lineHeight: 18 },
  slotBox: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 12, backgroundColor: "rgba(142,83,120,0.08)", borderRadius: 12, padding: 12 },
  slotText: { flex: 1, fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  confirm: { backgroundColor: colors.plum, borderRadius: 13, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  confirmText: { color: "#fff", fontSize: 14.5, fontFamily: fonts.sansBold },
  sheetNote: { fontSize: 10, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginTop: 8 },
});
