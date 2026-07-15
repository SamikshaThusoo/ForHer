import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePersona } from "@/context/PersonaContext";
import { TopBar } from "@/components/home/TopBar";
import { Greeting } from "@/components/home/Greeting";
import { PromoCard } from "@/components/home/PromoCard";
import { QuickActions } from "@/components/home/QuickActions";
import { WellnessSolutions } from "@/components/home/WellnessSolutions";
import { ForHerPromo } from "@/components/home/ForHerPromo";
import { LeaderboardCard } from "@/components/home/LeaderboardCard";
import { BottomNav } from "@/components/home/BottomNav";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

// The Habit Health home — the entry point. For Her is showcased where the activity
// tracker used to sit (ForHerPromo). Faithful RN port of the web src/app/page.tsx.
export default function Home() {
  const { persona, allPersonas, setPersonaId } = usePersona();

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      {/* Prototype control — switch personas (mirrors the web's out-of-phone switcher). */}
      <View style={styles.switcher}>
        {allPersonas.map((p) => {
          const on = p.id === persona.id;
          return (
            <Pressable key={p.id} onPress={() => setPersonaId(p.id)} style={[styles.pill, on && styles.pillOn]}>
              <Text style={[styles.pillText, on && styles.pillTextOn]}>{p.shortName}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <TopBar />
        <Greeting />
        <PromoCard />
        <QuickActions />
        <WellnessSolutions />
        <ForHerPromo />
        <LeaderboardCard />
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: hh.page },
  body: { paddingBottom: 24 },
  switcher: { flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: hh.page, justifyContent: "center" },
  pill: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#E7EBF1" },
  pillOn: { backgroundColor: hh.blueDeep },
  pillText: { fontSize: 11.5, fontFamily: fonts.sansBold, color: hh.textMuted },
  pillTextOn: { color: "#fff" },
});
