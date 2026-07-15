import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions } from "expo-camera";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, useReducedMotion } from "react-native-reanimated";
import { ScanLine } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { usePersona } from "@/context/PersonaContext";
import { PACKET_SCANS } from "@/data/packetScans";
import { verdictFor } from "@/lib/personalize";
import { colors, fonts } from "@/theme/tokens";

const VERDICT: Record<string, { label: string; color: string }> = {
  great: { label: "Great for you", color: "#2EAE6B" },
  ok: { label: "OK in moderation", color: "#F2A024" },
  watch: { label: "Watch this one", color: "#F67F1B" },
  avoid: { label: "Best avoided", color: "#E24B4A" },
};

/** Scanning beam that sweeps top↔bottom while scanning. */
function Beam({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (active && !reduce) t.value = withRepeat(withTiming(1, { duration: 2400 }), -1, true);
    else t.value = 0;
  }, [active, reduce, t]);
  const anim = useAnimatedStyle(() => ({ top: `${18 + t.value * 60}%` }));
  if (!active) return null;
  return <Animated.View pointerEvents="none" style={[styles.beam, anim]} />;
}

export default function Scan() {
  const { persona } = usePersona();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<typeof PACKET_SCANS[number] | null>(null);

  // No on-device vision model in the prototype: a capture simulates a match to a
  // seeded packet, then anchors the verdict to the persona's labs (verdictFor).
  const scan = () => {
    if (permission && !permission.granted) requestPermission();
    setScanning(true); setScanned(null);
    setTimeout(() => {
      setScanned(PACKET_SCANS[Math.floor(Math.random() * PACKET_SCANS.length)]);
      setScanning(false);
    }, 1400);
  };

  const verdict = scanned ? verdictFor(scanned, persona) : null;
  const v = verdict ? VERDICT[verdict.forYou] : null;
  const granted = permission?.granted;

  return (
    <Screen>
      <Header title="For Her · Scan" />
      <View style={styles.hero}>
        <Text style={styles.title}>Scan a packet</Text>
        <Text style={styles.sub}>Verdict in 1 second, anchored to your labs.</Text>
      </View>

      <View style={styles.viewport}>
        <LinearGradient colors={["#2A2A2A", "#1A1A1A"]} style={StyleSheet.absoluteFill} />
        {granted && <CameraView style={StyleSheet.absoluteFill} facing="back" />}

        <View style={[styles.corner, styles.tl]} pointerEvents="none" />
        <View style={[styles.corner, styles.tr]} pointerEvents="none" />
        <View style={[styles.corner, styles.bl]} pointerEvents="none" />
        <View style={[styles.corner, styles.br]} pointerEvents="none" />
        <Beam active={scanning} />

        <View style={styles.shutterStack}>
          <ScanLine size={18} strokeWidth={1.8} color="rgba(255,255,255,0.75)" />
          <PressableScale onPress={scan} disabled={scanning} style={styles.shutter}>
            <Text style={styles.shutterText}>{scanned ? "Scan another" : scanning ? "Scanning…" : "Tap to scan a packet"}</Text>
          </PressableScale>
        </View>
      </View>

      {scanned && verdict && v && (
        <View style={styles.verdict}>
          <View style={[styles.toneBand, { backgroundColor: v.color }]}>
            <Text style={styles.toneLabel}>{v.label.toUpperCase()}</Text>
          </View>
          <View style={styles.verdictBody}>
            <Text style={styles.packetName}>{scanned.imageHint ?? "📦"}  {scanned.brand} · {scanned.name}</Text>
            <Text style={styles.reason}>{verdict.oneLineReason}</Text>
            {scanned.altSuggestion && (
              <View style={styles.swap}>
                <Text style={styles.swapLabel}>Try instead</Text>
                <Text style={styles.swapName}>{scanned.altSuggestion.brand} · {scanned.altSuggestion.name}</Text>
                <Text style={styles.swapWhy}>{scanned.altSuggestion.whyBetter}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  title: { fontSize: 24, fontFamily: fonts.serif, color: colors.plumDeep },
  sub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 4 },

  viewport: { marginHorizontal: 18, aspectRatio: 3 / 4, maxHeight: 380, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", backgroundColor: "#1A1A1A" },
  corner: { position: "absolute", width: 34, height: 34, borderColor: "#fff" },
  tl: { top: "14%", left: "9%", borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  tr: { top: "14%", right: "9%", borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  bl: { bottom: "22%", left: "9%", borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  br: { bottom: "22%", right: "9%", borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  beam: { position: "absolute", left: "10%", right: "10%", height: 2, backgroundColor: "#34D399", shadowColor: "#34D399", shadowOpacity: 0.65, shadowRadius: 10 },
  shutterStack: { position: "absolute", left: 0, right: 0, bottom: 20, alignItems: "center", gap: 8 },
  shutter: { backgroundColor: "#fff", borderRadius: 999, paddingVertical: 11, paddingHorizontal: 22 },
  shutterText: { color: "#161616", fontSize: 13, fontFamily: fonts.sansBold },

  verdict: { marginHorizontal: 18, marginTop: 14, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#5B2A4A", shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  toneBand: { height: 34, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  toneLabel: { fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 0.6, color: "#fff" },
  verdictBody: { padding: 15 },
  packetName: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  reason: { fontSize: 13.5, fontFamily: fonts.sans, color: colors.plumDeep, marginTop: 8, lineHeight: 20 },
  swap: { marginTop: 12, backgroundColor: colors.plumSoft, borderRadius: 12, padding: 12 },
  swapLabel: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.plumBright },
  swapName: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 3 },
  swapWhy: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 17 },
});
