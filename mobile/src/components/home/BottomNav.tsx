import { View, Text, StyleSheet } from "react-native";
import { Home, Gamepad2, User, Menu, Plus, type LucideIcon } from "lucide-react-native";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const TABS: { Icon: LucideIcon; label: string; active?: boolean }[] = [
  { Icon: Home, label: "Home", active: true },
  { Icon: Gamepad2, label: "Play" },
  { Icon: User, label: "Profile" },
  { Icon: Menu, label: "Menu" },
];

/** Dark navy bottom bar — active tab in a blue pill, "My Benefits" button with
 *  a floating "+" badge, matching the real app. */
export function BottomNav() {
  return (
    <View style={styles.nav}>
      {TABS.map((t) => (
        <View key={t.label} style={styles.tab}>
          <View style={[styles.tabIc, t.active && styles.tabIcActive]}>
            <t.Icon size={20} strokeWidth={1.75} color={t.active ? "#fff" : "#8FA0C4"} />
          </View>
          <Text style={[styles.label, t.active && styles.labelActive]}>{t.label}</Text>
        </View>
      ))}
      <View style={styles.benWrap}>
        <View style={styles.fab}><Plus size={15} strokeWidth={2.5} color="#fff" /></View>
        <View style={styles.ben}><Text style={styles.benText}>My Benefits</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: 76, backgroundColor: "#101E42", borderTopLeftRadius: 22, borderTopRightRadius: 22,
    flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 6,
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: -4 }, elevation: 12,
  },
  tab: { alignItems: "center", gap: 2 },
  tabIc: { width: 40, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  tabIcActive: { backgroundColor: hh.blueBright },
  label: { fontSize: 10, fontFamily: fonts.sansMedium, color: "#8FA0C4" },
  labelActive: { color: "#fff", fontFamily: fonts.sansBold },
  benWrap: { alignItems: "flex-end" },
  fab: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: hh.blueBright,
    alignItems: "center", justifyContent: "center", marginBottom: -8, marginRight: -2, zIndex: 2,
    borderWidth: 2, borderColor: "#101E42",
  },
  ben: {
    borderRadius: 13, paddingVertical: 11, paddingHorizontal: 15, backgroundColor: "#3D6EF0",
    shadowColor: "#2060B0", shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  benText: { color: "#fff", fontSize: 11.5, fontFamily: fonts.sansBold },
});
