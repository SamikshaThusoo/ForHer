import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect } from "react-native-svg";
import { PressableScale } from "@/components/ui/PressableScale";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const BULLETS = [
  "10% off crowns, implants & orthodontics",
  "Unlimited free consults & X-rays",
  "1 OPG and 1 visit scaling",
];

/** A tiny checkerboard QR stand-in (matches the web repeating-conic gradient). */
function QrGlyph() {
  const cells = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    if ((r + c) % 2 === 0) cells.push(<Rect key={`${r}-${c}`} x={c * 9} y={r * 9} width={9} height={9} fill="#1B2A3D" />);
  }
  return <Svg width={54} height={54}>{cells}</Svg>;
}

/** Dental benefits promo card + 4-dot carousel indicator (State A). */
export function PromoCard() {
  return (
    <>
      <LinearGradient colors={["#EAF1FB", "#F3F7FC"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
        <View style={styles.left}>
          <Text style={styles.title}>Dental care benefits</Text>
          <Text style={styles.subtitle}>for you and your loved ones</Text>
          <View style={styles.bullets}>
            {BULLETS.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
          <PressableScale style={styles.btn}><Text style={styles.btnText}>Enroll Now</Text></PressableScale>
        </View>
        <View style={styles.qr}><QrGlyph /></View>
      </LinearGradient>
      <View style={styles.dots}>
        <View style={[styles.dotI, styles.dotOn]} />
        <View style={styles.dotI} />
        <View style={styles.dotI} />
        <View style={styles.dotI} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  promo: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 10,
    shadowColor: "#1B2A3D", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  left: { flex: 1 },
  title: { fontSize: 15, fontFamily: fonts.sansBold, color: hh.orangeDeep },
  subtitle: { fontSize: 13, fontFamily: fonts.sansMedium, color: hh.blueDeep, marginTop: 1 },
  bullets: { marginTop: 8, gap: 2 },
  bulletRow: { flexDirection: "row", gap: 5 },
  dot: { fontSize: 10.5, color: hh.textMuted, lineHeight: 18 },
  bulletText: { flex: 1, fontSize: 10.5, fontFamily: fonts.sans, color: hh.textMuted, lineHeight: 18 },
  btn: { alignSelf: "flex-start", backgroundColor: hh.orange, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13, marginTop: 10 },
  btnText: { color: "#fff", fontSize: 11, fontFamily: fonts.sansBold },
  qr: { width: 54, height: 54, borderRadius: 10, overflow: "hidden" },
  dots: { flexDirection: "row", gap: 5, justifyContent: "center", paddingTop: 10 },
  dotI: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#CBD3DE" },
  dotOn: { width: 16, backgroundColor: hh.blue },
});
