import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, ArrowRight } from "lucide-react-native";
import { usePersona } from "@/context/PersonaContext";
import { entryFraming } from "@/lib/journey";
import { fonts } from "@/theme/tokens";

/** The pre-assessment For Her entry card — persona-framed (state A shows the
 *  flagged AHC markers as chips). Extracted verbatim from ForHerPromo so the
 *  home banner and the /forher dashboard render the identical card. */
export function ForHerEntryCard() {
  const router = useRouter();
  const { persona } = usePersona();
  const f = entryFraming(persona);
  if (!f) return null;
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
});
