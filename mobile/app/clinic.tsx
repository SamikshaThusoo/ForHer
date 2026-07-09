import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Baby, Stethoscope, Salad, Brain, Sun, HeartPulse, UserRound, type LucideIcon } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { usePersona } from "@/context/PersonaContext";
import { personaTrack, getCareCircle } from "@/lib/journey";
import { useForHer, readCycleLog, saveCycleLog } from "@/lib/forher/state";
import { activeConditions } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { readHealthProfile, writeHealthProfile } from "@/lib/forher/healthprofile";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { colors, fonts } from "@/theme/tokens";

const TIER_COPY: Record<string, string> = {
  high: "Your screen points to a higher hormonal-health risk. Let's get you seen.",
  medium: "Your screen suggests a moderate hormonal-health risk worth checking.",
  low: "A couple of signals worth a light check-in.",
  none: "No risk signals right now — keep up your lifestyle habits.",
};

const ROLE_ICON: Record<string, LucideIcon> = {
  doctor: Stethoscope, nutritionist: Salad, psychologist: Brain,
  dermatologist: Sun, gynaecologist: HeartPulse, "care-coordinator": UserRound,
};

export default function Clinic() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const tier = personaTrack(persona);
  const [cycleLog, setCycleLog] = useState(() => readCycleLog(persona.id));

  const conditions = activeConditions({
    persona, cycleLog, dayLog: readDayLog(persona.id),
    cycleLength: cycleLengthFor(persona, cycleLog?.cycleLength), today: new Date(),
  });
  const hasConditions = conditions.length > 0;
  const missedTrack = conditions.some((c) => c.type === "missed-period") && cycleLog?.intent === "track";

  const circle = getCareCircle(tier, {
    acneOrHirsutism: false, ttc: cycleLog?.intent === "ttc", highMetabolic: tier === "high",
  });

  const setTtc = () => {
    if (!cycleLog) return;
    const next = { ...cycleLog, intent: "ttc" as const };
    saveCycleLog(persona.id, next);
    setCycleLog(next);
    writeHealthProfile(persona.id, { ...readHealthProfile(persona.id), ttc: true });
  };

  return (
    <Screen>
      <Header title="Clinic" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Clinic ForHer</Text>
        <Text style={styles.h1}>{hasConditions ? "Let's look into this" : "Your next step"}</Text>
        <Text style={styles.lede}>
          {hasConditions ? "Here's what your tracking has flagged — and what a check-in can do about it." : TIER_COPY[tier]}
        </Text>
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
          <Pressable onPress={setTtc} style={styles.intentBtn}><Text style={styles.intentBtnText}>Yes, I am</Text></Pressable>
        </View>
      )}

      {circle.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Your care team</Text>
          {circle.map((s) => {
            const Icon = ROLE_ICON[s.role] ?? Stethoscope;
            return (
              <View key={s.role} style={styles.careCard}>
                <View style={styles.careIcon}><Icon size={20} color={colors.plumBright} /></View>
                <View style={styles.careBody}>
                  <Text style={styles.careLabel}>{s.label}</Text>
                  <Text style={styles.careReason}>{s.reason}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      <Text style={styles.disclaimer}>This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.</Text>
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
  careCard: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 18, marginBottom: 9, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 13 },
  careIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)" },
  careBody: { flex: 1 },
  careLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.plumDeep },
  careReason: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 17 },

  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginHorizontal: 22, marginTop: 22, lineHeight: 14 },
});
