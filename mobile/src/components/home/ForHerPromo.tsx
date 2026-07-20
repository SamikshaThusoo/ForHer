import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, ArrowRight, ScanLine, Stethoscope, HeartPulse } from "lucide-react-native";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { entryFraming, personaTrack } from "@/lib/journey";
import { activeNudge, activeConditions } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { ForHerHub } from "./ForHerHub";
import { ForHerCompanionHub } from "./ForHerCompanionHub";
import { fonts } from "@/theme/tokens";

/** The For Her section on the Habit home — entry card, companion, or live care hub. */
export function ForHerPromo() {
  const router = useRouter();
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const f = entryFraming(persona);
  if (!f) return null;
  const track = personaTrack(persona);

  // ---- First-time / pre-hydration: entry card → assessment ----
  if (!fh.hydrated || !fh.assessed) {
    const hasMarkers = f.markers && f.markers.length > 0;
    return (
      <LinearGradient colors={["#5B2A4A", "#7A3A62", "#B5687E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.entryCard}>
        <View style={styles.entryHead}>
          <Text style={styles.entryBrand}>For Her</Text>
          <View style={styles.entryTag}><Text style={styles.entryTagText}>PMOS</Text></View>
          <View style={styles.spark}><Sparkles size={13} color="#fff" /></View>
        </View>
        {hasMarkers ? (
          <>
            <Text style={styles.entryEyebrow}>Flagged in your health check</Text>
            <View style={styles.markers}>
              {f.markers!.map((m) => (
                <View key={m.label} style={styles.marker}><Text style={styles.markerText}><Text style={styles.markerStrong}>{m.value}</Text> {m.label}</Text></View>
              ))}
            </View>
            <Text style={styles.entrySub}>These can be linked to PMOS — take the 2-minute check.</Text>
          </>
        ) : (
          <>
            <Text style={styles.entryTitle}>{f.state === "C" ? "Understand your cycle & hormones" : "A quick check for your hormonal health"}</Text>
            <Text style={styles.entrySub}>{f.state === "C" ? "A 2-minute PMOS check — no health report needed." : "See whether PMOS patterns apply to you."}</Text>
          </>
        )}
        <Pressable style={styles.entryCta} onPress={() => router.push("/for-her")}>
          <Text style={styles.entryCtaText}>Take the check</Text><ArrowRight size={15} color="#5B2A4A" />
        </Pressable>
      </LinearGradient>
    );
  }

  const isStanding = track === "medium" || track === "high";
  const sig = {
    persona, cycleLog: fh.cycleLog, dayLog: readDayLog(persona.id),
    cycleLength: cycleLengthFor(persona, fh.cycleLog?.cycleLength), today: new Date(),
  };
  // A firing clinical signal (missed / irregular / symptom) surfaces on the card for
  // every tier — matching what the clinic page shows. Only when there's none do we
  // fall back to the standing care-circle strip (care-plan) or a soft nudge (companion).
  const condition = activeConditions(sig)[0] ?? null;
  const nudge = isStanding ? null : activeNudge({ tier: track, ...sig });
  const content = condition
    ? { title: condition.title, cta: condition.cta, href: condition.href }
    : isStanding
      ? { title: "Your care circle & next visit", cta: "Open", href: "/clinic" as const }
      : nudge ? { title: nudge.title, cta: nudge.cta, href: nudge.href } : null;
  const showCondition = !!condition;

  const clinicCard = content ? (
    <Pressable style={styles.clinicEntry} onPress={() => router.push(content.href as never)}>
      <View style={styles.clinicIcon}>{showCondition || !isStanding ? <HeartPulse size={18} color="#B5532F" /> : <Stethoscope size={18} color="#B5532F" />}</View>
      <View style={styles.clinicText}>
        <Text style={styles.clinicEyebrow}>Clinic ForHer</Text>
        <Text style={styles.clinicTitle} numberOfLines={1}>{content.title}</Text>
      </View>
      <View style={styles.clinicCta}><Text style={styles.clinicCtaText}>{content.cta}</Text><ArrowRight size={14} color="#8E5378" /></View>
    </Pressable>
  ) : null;

  // ---- Assessed, no care plan: companion carousel ----
  if (track === "none") {
    return (
      <View style={styles.hubWrap}>
        <View style={styles.hubHead}>
          <View style={styles.hubLeft}>
            <Text style={styles.hubBrand}>For Her <Text style={styles.hubTag}>Companion</Text></Text>
            <Text style={styles.hubPlanMuted}>Tracking & insights</Text>
          </View>
          <Pressable style={styles.hubScan} onPress={() => router.push("/meal-plan" as never)}><ScanLine size={18} color="#2F7A7A" /><Text style={styles.hubScanText}>Meal Plan</Text></Pressable>
        </View>
        {clinicCard}
        <ForHerCompanionHub />
      </View>
    );
  }

  // ---- Assessed, on care plan: live carousel ----
  return (
    <View style={styles.hubWrap}>
      <View style={styles.hubHead}>
        <View style={styles.hubLeft}>
          <Text style={styles.hubBrand}>For Her <Text style={styles.hubTag}>PMOS</Text></Text>
          <Pressable onPress={() => router.push("/plan")}><Text style={styles.hubPlan}>Day {Math.min(fh.day, 90)} of 90 · See plan ›</Text></Pressable>
        </View>
        <Pressable style={styles.hubScan} onPress={() => router.push("/meal-plan" as never)}><ScanLine size={18} color="#2F7A7A" /><Text style={styles.hubScanText}>Meal Plan</Text></Pressable>
      </View>
      {clinicCard}
      <ForHerHub />
    </View>
  );
}

const styles = StyleSheet.create({
  entryCard: {
    margin: 16, padding: 16, borderRadius: 20, overflow: "hidden",
    shadowColor: "#5B2A4A", shadowOpacity: 0.3, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 4,
  },
  entryHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  entryBrand: { fontFamily: fonts.serif, fontSize: 18, color: "#fff" },
  entryTag: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
  entryTagText: { fontSize: 9, fontFamily: fonts.sansBold, letterSpacing: 0.7, color: "#fff" },
  spark: { marginLeft: "auto", opacity: 0.85 },
  entryEyebrow: { fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: "rgba(255,255,255,0.85)", marginTop: 12 },
  entryTitle: { fontSize: 16, fontFamily: fonts.sansBold, lineHeight: 20, color: "#fff", marginTop: 11, maxWidth: "92%" },
  markers: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  marker: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  markerText: { fontSize: 11, fontFamily: fonts.sans, color: "#fff" },
  markerStrong: { fontFamily: fonts.sansBold },
  entrySub: { fontSize: 12, lineHeight: 17, fontFamily: fonts.sans, color: "rgba(255,255,255,0.92)", marginTop: 8, maxWidth: "88%" },
  entryCta: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "#fff", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, marginTop: 13 },
  entryCtaText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: "#5B2A4A" },

  hubWrap: { marginTop: 8, marginBottom: 4 },
  hubHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  hubLeft: { gap: 3 },
  hubBrand: { fontFamily: fonts.serif, fontSize: 17, color: "#5B2A4A" },
  hubTag: { fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 0.7, color: "#8E5378" },
  hubPlan: { fontSize: 11.5, fontFamily: fonts.sansBold, color: "#8E5378" },
  hubPlanMuted: { fontSize: 11.5, fontFamily: fonts.sansMedium, color: "#9A8A92" },
  hubScan: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(47,122,122,0.1)", borderWidth: 1, borderColor: "rgba(47,122,122,0.22)", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  hubScanText: { fontSize: 12, fontFamily: fonts.sansBold, color: "#2F7A7A" },

  clinicEntry: {
    flexDirection: "row", alignItems: "center", gap: 11, marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: "#FBEFE6", borderWidth: 1, borderColor: "rgba(181,83,47,0.14)", borderRadius: 15, padding: 11, paddingHorizontal: 13,
    shadowColor: "#5B2A4A", shadowOpacity: 0.07, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 1,
  },
  clinicIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(181,83,47,0.14)" },
  clinicText: { flex: 1, gap: 1 },
  clinicEyebrow: { fontSize: 10, fontFamily: fonts.sansBold, color: "#B5532F" },
  clinicTitle: { fontSize: 13.5, fontFamily: fonts.sansBold, color: "#3E1B33" },
  clinicCta: { flexDirection: "row", alignItems: "center", gap: 4 },
  clinicCtaText: { fontSize: 12, fontFamily: fonts.sansBold, color: "#8E5378" },
});
