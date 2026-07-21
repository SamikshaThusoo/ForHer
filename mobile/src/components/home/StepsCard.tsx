import { View, Text, Image, StyleSheet } from "react-native";
import { RefreshCw, Target, Zap } from "lucide-react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

/** Daily-steps tracker card — sync row, park scene with progress medallions,
 *  and the yellow "Start a Challenge" pill. Art lifted from the real app. */
export function StepsCard() {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.sync}>
          <RefreshCw size={13} strokeWidth={2.25} color={hh.blue} />
          <Text style={styles.syncText}>Last sync: Just now</Text>
        </View>
        <View style={styles.goal}>
          <View style={styles.goalIc}><Target size={16} strokeWidth={2} color="#F67F1B" /></View>
          <View>
            <Text style={styles.goalNum}>8,000</Text>
            <Text style={styles.goalLabel}>Daily Step Goal</Text>
          </View>
        </View>
      </View>

      <Image
        source={require("../../../assets/home/park-scene.png")}
        style={styles.img}
        resizeMode="cover"
      />

      <PressableScale style={styles.btn}>
        <Zap size={16} strokeWidth={2.25} color="#1B2A3D" fill="#1B2A3D" />
        <Text style={styles.btnText}>Start a Challenge</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14, marginTop: 14, borderRadius: 18, backgroundColor: hh.surface, overflow: "hidden",
    shadowColor: "#1B2A3D", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    paddingBottom: 12,
  },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  sync: { flexDirection: "row", alignItems: "center", gap: 6 },
  syncText: { fontSize: 11.5, fontFamily: fonts.sansMedium, color: hh.textMuted },
  goal: { flexDirection: "row", alignItems: "center", gap: 7 },
  goalIc: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#FDEBD9",
    alignItems: "center", justifyContent: "center",
  },
  goalNum: { fontSize: 14, fontFamily: fonts.sansBold, color: hh.text, lineHeight: 16 },
  goalLabel: { fontSize: 9.5, fontFamily: fonts.sans, color: hh.textMuted },
  img: { width: "100%", aspectRatio: 1113 / 355 },
  btn: {
    marginHorizontal: 12, marginTop: 12, borderRadius: 999, backgroundColor: "#F9D75E",
    paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
  },
  btnText: { fontSize: 13.5, fontFamily: fonts.sansBold, color: "#1B2A3D" },
});
