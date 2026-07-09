import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScanLine, Camera } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { usePersona } from "@/context/PersonaContext";
import { PACKET_SCANS } from "@/data/packetScans";
import { verdictFor } from "@/lib/personalize";
import { colors, fonts } from "@/theme/tokens";

const VERDICT: Record<string, { label: string; color: string }> = {
  great: { label: "Great for you", color: "#4F9D69" },
  ok: { label: "OK in moderation", color: "#2F7A7A" },
  watch: { label: "Watch this one", color: "#C9772A" },
  avoid: { label: "Best avoided", color: "#C76B7A" },
};

export default function Scan() {
  const { persona } = usePersona();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<typeof PACKET_SCANS[number] | null>(null);

  // No on-device vision model in the prototype: a capture simulates a match to a
  // seeded packet, then anchors the verdict to the persona's labs (verdictFor).
  const capture = () => {
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
        <Text style={styles.sub}>Point at a label — verdict anchored to your labs.</Text>
      </View>

      <View style={styles.viewport}>
        {granted ? (
          <CameraView style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.permBox}>
            <Camera size={36} color={colors.plumBright} />
            <Text style={styles.permText}>Camera access is needed to scan packets.</Text>
            <Pressable onPress={requestPermission} style={styles.permBtn}><Text style={styles.permBtnText}>Enable camera</Text></Pressable>
          </View>
        )}

        {granted && <View style={styles.frame} pointerEvents="none" />}
        {granted && scanning && (
          <View style={styles.overlay} pointerEvents="none"><ActivityIndicator color="#fff" /><Text style={styles.overlayText}>Scanning…</Text></View>
        )}
      </View>

      {granted && (
        <Pressable onPress={capture} disabled={scanning} style={[styles.captureBtn, scanning && styles.captureOff]}>
          <ScanLine size={18} color="#fff" /><Text style={styles.captureText}>{scanned ? "Scan another" : "Scan packet"}</Text>
        </Pressable>
      )}

      {scanned && verdict && v && (
        <View style={styles.verdict}>
          <Text style={styles.packetName}>{scanned.imageHint ?? "📦"}  {scanned.brand} · {scanned.name}</Text>
          <View style={[styles.badge, { backgroundColor: `${v.color}1f` }]}><Text style={[styles.badgeText, { color: v.color }]}>{v.label}</Text></View>
          <Text style={styles.reason}>{verdict.oneLineReason}</Text>
          {scanned.altSuggestion && (
            <View style={styles.swap}>
              <Text style={styles.swapLabel}>Try instead</Text>
              <Text style={styles.swapName}>{scanned.altSuggestion.brand} · {scanned.altSuggestion.name}</Text>
              <Text style={styles.swapWhy}>{scanned.altSuggestion.whyBetter}</Text>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  title: { fontSize: 24, fontFamily: fonts.serif, color: colors.plumDeep },
  sub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 4 },
  viewport: { marginHorizontal: 18, height: 260, borderRadius: 20, overflow: "hidden", backgroundColor: "#2A1826", alignItems: "center", justifyContent: "center" },
  permBox: { alignItems: "center", gap: 12, padding: 24 },
  permText: { fontSize: 13, fontFamily: fonts.sansMedium, color: "#EAD9E2", textAlign: "center" },
  permBtn: { backgroundColor: colors.plum, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 20 },
  permBtnText: { color: "#fff", fontSize: 13, fontFamily: fonts.sansBold },
  frame: { position: "absolute", top: 50, left: 40, right: 40, bottom: 50, borderWidth: 2, borderColor: "rgba(255,255,255,0.7)", borderRadius: 16 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(42,24,38,0.4)" },
  overlayText: { color: "#fff", fontSize: 13, fontFamily: fonts.sansMedium },
  captureBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 18, marginTop: 12, backgroundColor: colors.plum, borderRadius: 14, paddingVertical: 14 },
  captureOff: { opacity: 0.6 },
  captureText: { color: "#fff", fontSize: 14, fontFamily: fonts.sansBold },
  verdict: { marginHorizontal: 18, marginTop: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15 },
  packetName: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep, marginBottom: 8 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  badgeText: { fontSize: 12, fontFamily: fonts.sansBold },
  reason: { fontSize: 13.5, fontFamily: fonts.sans, color: colors.plumDeep, marginTop: 10, lineHeight: 20 },
  swap: { marginTop: 12, backgroundColor: "rgba(79,157,105,0.08)", borderRadius: 12, padding: 12 },
  swapLabel: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: "#3E7A54" },
  swapName: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 3 },
  swapWhy: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 17 },
});
