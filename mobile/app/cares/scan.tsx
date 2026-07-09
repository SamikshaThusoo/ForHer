import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { ScanLine } from "lucide-react-native";
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
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<typeof PACKET_SCANS[number] | null>(null);

  const fakeScan = () => {
    setScanning(true);
    setScanned(null);
    setTimeout(() => {
      setScanned(PACKET_SCANS[Math.floor(Math.random() * PACKET_SCANS.length)]);
      setScanning(false);
    }, 1400);
  };

  const verdict = scanned ? verdictFor(scanned, persona) : null;
  const v = verdict ? VERDICT[verdict.forYou] : null;

  return (
    <Screen>
      <Header title="For Her · Scan" />
      <View style={styles.hero}>
        <Text style={styles.title}>Scan a packet</Text>
        <Text style={styles.sub}>Verdict in 1 second, anchored to your labs.</Text>
      </View>

      <Pressable onPress={fakeScan} disabled={scanning} style={styles.viewport}>
        {scanning ? (
          <>
            <ActivityIndicator color={colors.plumBright} />
            <Text style={styles.viewportText}>Scanning…</Text>
          </>
        ) : scanned ? (
          <>
            <Text style={styles.packetEmoji}>{scanned.imageHint ?? "📦"}</Text>
            <Text style={styles.packetName}>{scanned.brand} · {scanned.name}</Text>
            <Text style={styles.rescan}>Tap to scan another</Text>
          </>
        ) : (
          <>
            <ScanLine size={40} color={colors.plumBright} />
            <Text style={styles.viewportText}>Tap to scan a packet</Text>
          </>
        )}
      </Pressable>

      {scanned && verdict && v && (
        <View style={styles.verdict}>
          <View style={[styles.badge, { backgroundColor: `${v.color}1f` }]}>
            <Text style={[styles.badgeText, { color: v.color }]}>{v.label}</Text>
          </View>
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
  viewport: { marginHorizontal: 18, height: 220, borderRadius: 20, borderWidth: 2, borderColor: "rgba(142,83,120,0.3)", borderStyle: "dashed", backgroundColor: "rgba(142,83,120,0.05)", alignItems: "center", justifyContent: "center", gap: 10 },
  viewportText: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.textSoft },
  packetEmoji: { fontSize: 48 },
  packetName: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.plumDeep, textAlign: "center", paddingHorizontal: 20 },
  rescan: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 4 },
  verdict: { marginHorizontal: 18, marginTop: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  badgeText: { fontSize: 12, fontFamily: fonts.sansBold },
  reason: { fontSize: 13.5, fontFamily: fonts.sans, color: colors.plumDeep, marginTop: 10, lineHeight: 20 },
  swap: { marginTop: 12, backgroundColor: "rgba(79,157,105,0.08)", borderRadius: 12, padding: 12 },
  swapLabel: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: "#3E7A54" },
  swapName: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 3 },
  swapWhy: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 17 },
});
