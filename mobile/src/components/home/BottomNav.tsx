import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Home, Gamepad2, User, Menu, Plus, type LucideIcon } from "lucide-react-native";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const TABS: { Icon: LucideIcon; label: string; active?: boolean }[] = [
  { Icon: Home, label: "Home", active: true },
  { Icon: Gamepad2, label: "Play" },
  { Icon: User, label: "Profile" },
  { Icon: Menu, label: "Menu" },
];

/** Sticky bottom nav — four flat tabs + an elevated "My Benefits" pill. */
export function BottomNav() {
  return (
    <View style={styles.nav}>
      {TABS.map((t) => (
        <View key={t.label} style={styles.tab}>
          <t.Icon size={22} strokeWidth={1.75} color={t.active ? hh.blue : hh.textSoft} />
          <Text style={[styles.label, t.active && styles.labelActive]}>{t.label}</Text>
        </View>
      ))}
      <LinearGradient colors={[hh.blue, hh.blueBright]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ben}>
        <Plus size={15} strokeWidth={2.25} color="#fff" />
        <Text style={styles.benText}>My Benefits</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: 74, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: hh.line,
    flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 8,
  },
  tab: { alignItems: "center", gap: 3 },
  label: { fontSize: 10, fontFamily: fonts.sansMedium, color: hh.textSoft },
  labelActive: { color: hh.blue, fontFamily: fonts.sansBold },
  ben: {
    borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 7,
    transform: [{ translateY: -2 }],
    shadowColor: "#2060B0", shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  benText: { color: "#fff", fontSize: 11.5, fontFamily: fonts.sansBold },
});
