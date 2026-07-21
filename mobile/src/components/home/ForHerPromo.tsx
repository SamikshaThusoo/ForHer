import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ArrowRight, ScanLine, Stethoscope, HeartPulse } from "lucide-react-native";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { entryFraming, personaTrack } from "@/lib/journey";
import { activeNudge, activeConditions } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { ForHerHub } from "./ForHerHub";
import { ForHerCompanionHub } from "./ForHerCompanionHub";
import { ForHerEntryCard } from "./ForHerEntryCard";
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
    return <ForHerEntryCard />;
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
