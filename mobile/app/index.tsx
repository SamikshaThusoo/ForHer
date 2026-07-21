import { useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RotateCcw } from "lucide-react-native";
import { usePersona } from "@/context/PersonaContext";
import { resetForHer } from "@/lib/forher/state";
import { TopBar } from "@/components/home/TopBar";
import { Greeting } from "@/components/home/Greeting";
import { LifeSyncBanner } from "@/components/home/LifeSyncBanner";
import { WellnessSolutions } from "@/components/home/WellnessSolutions";
import { StepsCard } from "@/components/home/StepsCard";
import { ForHerPromo } from "@/components/home/ForHerPromo";
import { BottomNav } from "@/components/home/BottomNav";
import * as Updates from "expo-updates";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

// The Habit Health home — replica of the real app's home (LifeSync+ hero, wellness
// range, step tracker). For Her lives inline in the engagement-banner slot: entry
// card pre-assessment, full hub (carousel, meal plan, clinic) once assessed.
export default function Home() {
  const { persona, allPersonas, setPersonaId } = usePersona();

  // The floating nav hides while scrolling down and returns on scroll-up,
  // like the real app. Direction from the offset delta, with a small deadzone.
  const [navHidden, setNavHidden] = useState(false);
  const lastY = useRef(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    if (y <= 0) setNavHidden(false);
    else if (dy > 6) setNavHidden(true);
    else if (dy < -6) setNavHidden(false);
    lastY.current = y;
  };

  // Prototype reset — clears all For Her state (assessment, cycle, bookings, check-ins)
  // then restarts the app so every screen re-hydrates fresh. Mirrors the web's Reset.
  const onReset = () => {
    Alert.alert(
      "Reset For Her?",
      "Clears your assessment, cycle log, bookings and check-ins, and starts fresh.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            resetForHer();
            try { await Updates.reloadAsync(); } catch { /* dev/unsupported — clears on next open */ }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      {/* Prototype controls — Reset (left) + persona switcher (right), mirroring the web. */}
      <View style={styles.switcher}>
        <Pressable onPress={onReset} style={styles.resetBtn}>
          <RotateCcw size={12} color={hh.textMuted} />
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
        <View style={styles.personas}>
          {allPersonas.map((p) => {
            const on = p.id === persona.id;
            return (
              <Pressable key={p.id} onPress={() => setPersonaId(p.id)} style={[styles.pill, on && styles.pillOn]}>
                <Text style={[styles.pillText, on && styles.pillTextOn]}>{p.shortName}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <TopBar />
        <Greeting />
        <LifeSyncBanner />
        <WellnessSolutions />
        <StepsCard />
        <ForHerPromo />
      </ScrollView>

      <BottomNav hidden={navHidden} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: hh.page },
  body: { paddingBottom: 110 }, // clears the floating nav
  switcher: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 7, backgroundColor: hh.page },
  resetBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, backgroundColor: "#E7EBF1" },
  resetText: { fontSize: 11, fontFamily: fonts.sansBold, color: hh.textMuted },
  personas: { flexDirection: "row", gap: 6 },
  pill: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#E7EBF1" },
  pillOn: { backgroundColor: hh.blueDeep },
  pillText: { fontSize: 11.5, fontFamily: fonts.sansBold, color: hh.textMuted },
  pillTextOn: { color: "#fff" },
});
