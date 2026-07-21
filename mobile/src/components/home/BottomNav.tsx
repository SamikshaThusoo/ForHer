import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Home, Gamepad2, User, Menu, Cross, type LucideIcon } from "lucide-react-native";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const TABS: { Icon: LucideIcon; label: string; active?: boolean }[] = [
  { Icon: Home, label: "Home", active: true },
  { Icon: Gamepad2, label: "Play" },
  { Icon: User, label: "Profile" },
  { Icon: Menu, label: "Menu" },
];

/** Floating bottom nav, matching the real app: white pill bar (active tab in a
 *  light-blue chip) plus a separate "My Benefits" block flush to the right edge.
 *  Slides off-screen while scrolling down and back in on scroll-up. */
export function BottomNav({ hidden = false }: { hidden?: boolean }) {
  const insets = useSafeAreaInsets();
  const shift = useSharedValue(0);

  useEffect(() => {
    shift.value = withTiming(hidden ? 1 : 0, { duration: 240 });
  }, [hidden, shift]);

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: shift.value * 140 }],
  }));

  return (
    <Animated.View
      style={[styles.wrap, { bottom: Math.max(insets.bottom - 12, 12) }, slide]}
      pointerEvents={hidden ? "none" : "auto"}
    >
      <View style={styles.bar}>
        {TABS.map((t) => (
          <View key={t.label} style={styles.tab}>
            <View style={[styles.tabIc, t.active && styles.tabIcActive]}>
              <t.Icon
                size={20}
                strokeWidth={t.active ? 1.75 : 2}
                color={t.active ? hh.blue : hh.text}
                fill={t.active ? hh.blue : "none"}
              />
            </View>
            <Text style={[styles.label, t.active && styles.labelActive]}>{t.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.ben}>
        <Cross size={18} strokeWidth={1.75} color="#fff" />
        <Text style={styles.benText}>My Benefits</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center" },
  bar: {
    flex: 1, marginLeft: 10, height: 58, borderRadius: 29, backgroundColor: "#fff",
    flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 8,
    shadowColor: "#1B2A3D", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 8,
  },
  tab: { alignItems: "center", gap: 1 },
  tabIc: { width: 44, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tabIcActive: { backgroundColor: "#D2E1F0" },
  label: { fontSize: 10.5, fontFamily: fonts.sansMedium, color: hh.text },
  labelActive: { color: hh.blue, fontFamily: fonts.sansBold },
  ben: {
    marginLeft: 8, width: 94, height: 58, borderTopLeftRadius: 24, borderBottomLeftRadius: 24,
    backgroundColor: "#1E5AAD", alignItems: "center", justifyContent: "center", gap: 3,
    shadowColor: "#1E5AAD", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 8,
  },
  benText: { color: "#fff", fontSize: 10.5, fontFamily: fonts.sansBold },
});
