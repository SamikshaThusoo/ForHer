import { View, Text, StyleSheet } from "react-native";
import { Bell, FileText, ShoppingCart } from "lucide-react-native";
import { HabitHealthLogo } from "./HabitHealthLogo";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

/** Brand row — HABIT/HEALTH lockup left, HC mark + bell/wallet/cart icons right. */
export function TopBar() {
  return (
    <View style={styles.bar}>
      <HabitHealthLogo />
      <View style={styles.right}>
        <View style={styles.hc}><Text style={styles.hcText}>HC</Text></View>
        <Bell size={20} strokeWidth={1.75} color={hh.text} />
        <FileText size={20} strokeWidth={1.75} color={hh.text} />
        <ShoppingCart size={20} strokeWidth={1.75} color={hh.text} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: hh.surface, paddingVertical: 11, paddingHorizontal: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderBottomWidth: 1, borderBottomColor: hh.line,
  },
  right: { flexDirection: "row", alignItems: "center", gap: 13 },
  hc: {
    width: 29, height: 29, borderRadius: 15, borderWidth: 2, borderColor: hh.greenHc,
    alignItems: "center", justifyContent: "center",
  },
  hcText: { color: hh.greenHc, fontFamily: fonts.sansBold, fontSize: 10 },
});
