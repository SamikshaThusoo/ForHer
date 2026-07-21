import { View, Text, StyleSheet } from "react-native";
import { ArrowDownToLine } from "lucide-react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

/** "Complete Your Health Risk Assessment" card — grey panel with a Take HRA
 *  pill and the orange HRA-status ring, matching the real app. */
export function HraCard() {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.title}>Complete Your Health Risk Assessment</Text>
        <Text style={styles.sub}>Take a comprehensive review of your health!</Text>
        <PressableScale style={styles.btn}>
          <Text style={styles.btnText}>Take HRA</Text>
        </PressableScale>
      </View>
      <View style={styles.ring}>
        <View style={styles.disc}>
          <Text style={styles.discText}>Your HRA Status</Text>
          <View style={styles.discIc}>
            <ArrowDownToLine size={12} strokeWidth={2} color={hh.text} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14, marginTop: 22, borderRadius: 20, backgroundColor: "#EEEEEE",
    padding: 16, flexDirection: "row", alignItems: "center", gap: 12,
  },
  left: { flex: 1 },
  title: { fontSize: 15.5, lineHeight: 20, fontFamily: fonts.sansBold, color: hh.text },
  sub: { fontSize: 11.5, lineHeight: 16, fontFamily: fonts.sans, color: hh.textMuted, marginTop: 6, maxWidth: "92%" },
  btn: {
    alignSelf: "flex-start", marginTop: 14, backgroundColor: "#fff", borderRadius: 999,
    paddingVertical: 9, paddingHorizontal: 19,
  },
  btnText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: hh.text },
  ring: {
    width: 118, height: 118, borderRadius: 59, borderWidth: 9, borderColor: "#EB8E48",
    alignItems: "center", justifyContent: "center",
  },
  disc: {
    width: 86, height: 86, borderRadius: 43, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", gap: 6,
    shadowColor: "#1B2A3D", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  discText: { fontSize: 9.5, lineHeight: 12, fontFamily: fonts.sansBold, color: hh.text, textAlign: "center", maxWidth: 58 },
  discIc: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: hh.text,
    alignItems: "center", justifyContent: "center",
  },
});
