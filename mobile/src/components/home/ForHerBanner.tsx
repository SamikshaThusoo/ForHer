import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, ArrowRight } from "lucide-react-native";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { entryFraming } from "@/lib/journey";
import { PressableScale } from "@/components/ui/PressableScale";
import { ForHerEntryCard } from "./ForHerEntryCard";
import { fonts } from "@/theme/tokens";

/** For Her in the engagement-banner slot. Pre-assessment personas get the full
 *  persona-framed entry card (flagged AHC markers etc.) exactly as before;
 *  assessed personas get a compact banner into the /forher dashboard. */
export function ForHerBanner() {
  const router = useRouter();
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  if (!entryFraming(persona)) return null;

  if (!fh.hydrated || !fh.assessed) return <ForHerEntryCard />;

  return (
    <PressableScale onPress={() => router.push("/forher" as never)}>
      <LinearGradient
        colors={["#5B2A4A", "#7A3A62", "#B5687E"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.left}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>For Her</Text>
            <View style={styles.tag}><Text style={styles.tagText}>PMOS</Text></View>
          </View>
          <Text style={styles.title}>Day {Math.min(fh.day, 90)} of your 90-day plan</Text>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Open For Her</Text>
            <ArrowRight size={13} color="#5B2A4A" />
          </View>
        </View>
        <View style={styles.spark}><Sparkles size={34} strokeWidth={1.25} color="rgba(255,255,255,0.5)" /></View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14, marginTop: 18, marginBottom: 6, borderRadius: 18, padding: 16,
    flexDirection: "row", alignItems: "center",
    shadowColor: "#5B2A4A", shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 4,
  },
  left: { flex: 1 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { fontFamily: fonts.serif, fontSize: 17, color: "#fff" },
  tag: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
  tagText: { fontSize: 9, fontFamily: fonts.sansBold, letterSpacing: 0.7, color: "#fff" },
  title: { fontSize: 13, fontFamily: fonts.sansMedium, lineHeight: 18, color: "rgba(255,255,255,0.94)", marginTop: 6 },
  cta: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
    backgroundColor: "#fff", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13, marginTop: 11,
  },
  ctaText: { fontSize: 11.5, fontFamily: fonts.sansBold, color: "#5B2A4A" },
  spark: { marginLeft: 10 },
});
