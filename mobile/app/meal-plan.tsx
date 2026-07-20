import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Salad, Coffee, Sun, Moon, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { MEAL_PLAN, mealPlanUnlocked, nutritionistIntakeDay } from "@/lib/forher/mealplan";
import type { MealType } from "@/lib/forher/foodlog";
import { colors, fonts } from "@/theme/tokens";

const MEALS: { type: MealType; label: string; time: string; Icon: typeof Coffee }[] = [
  { type: "breakfast", label: "Breakfast", time: "7–9 AM", Icon: Coffee },
  { type: "lunch", label: "Lunch", time: "12–2 PM", Icon: Sun },
  { type: "dinner", label: "Dinner", time: "7–9 PM", Icon: Moon },
];

export default function MealPlan() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const unlocked = mealPlanUnlocked(persona, fh.day);
  const intakeDay = nutritionistIntakeDay(persona);
  const [open, setOpen] = useState<MealType | null>("breakfast");

  return (
    <Screen>
      <Header title="Dietician Meal Plan" />

      <LinearGradient colors={["#2F6B50", "#4A9A72"]} style={styles.hero}>
        <Salad size={22} color="rgba(255,255,255,0.9)" />
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Your prescribed plan</Text>
          <Text style={styles.heroSub}>Personalised by your nutritionist · low-GI, cycle-synced</Text>
        </View>
      </LinearGradient>

      {!unlocked ? (
        <View style={styles.locked}>
          <Text style={styles.lockedTitle}>Plan not yet unlocked</Text>
          <Text style={styles.lockedSub}>
            {intakeDay
              ? `Your nutritionist intake is on Day ${intakeDay}. Your meal plan will appear here after that session.`
              : "Your track doesn't include a nutritionist intake. Speak to your care coordinator to upgrade."}
          </Text>
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.note}>
            These are your dietician's suggestions — not a strict prescription. Swap within the same category when needed.
          </Text>
          {MEALS.map(({ type, label, time, Icon }) => {
            const isOpen = open === type;
            const options = MEAL_PLAN[type];
            return (
              <View key={type} style={styles.mealCard}>
                <PressableScale onPress={() => setOpen(isOpen ? null : type)} style={styles.mealHead}>
                  <View style={styles.mealIcon}><Icon size={17} color={colors.plumBright} /></View>
                  <View style={styles.mealMeta}>
                    <Text style={styles.mealLabel}>{label}</Text>
                    <Text style={styles.mealTime}>{time}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }} />
                </PressableScale>
                {isOpen && (
                  <View style={styles.options}>
                    {options.map((opt, i) => (
                      <View key={i} style={styles.option}>
                        <View style={styles.optDot} />
                        <View style={styles.optBody}>
                          <Text style={styles.optName}>{opt.name}</Text>
                          <Text style={styles.optNote}>{opt.note}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Your dietician reviews this plan at each follow-up and adjusts it based on your logs.</Text>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: 12, margin: 16, borderRadius: 18, padding: 16 },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 15, fontFamily: fonts.sansBold, color: "#fff" },
  heroSub: { fontSize: 11.5, fontFamily: fonts.sans, color: "rgba(255,255,255,0.85)", marginTop: 2, lineHeight: 16 },

  locked: { margin: 20, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 20, alignItems: "center", gap: 8 },
  lockedTitle: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.plumDeep },
  lockedSub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, textAlign: "center", lineHeight: 18 },

  body: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  note: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.textSoft, fontStyle: "italic", lineHeight: 16, paddingHorizontal: 2 },

  mealCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  mealHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  mealIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.08)" },
  mealMeta: { flex: 1 },
  mealLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.plumDeep },
  mealTime: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.textMuted, marginTop: 1 },

  options: { borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  option: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  optDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.plumBright, marginTop: 6 },
  optBody: { flex: 1 },
  optName: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.plumDeep, lineHeight: 18 },
  optNote: { fontSize: 11, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 1 },

  footer: { marginTop: 6, marginBottom: 10, padding: 14, backgroundColor: "rgba(142,83,120,0.05)", borderRadius: 14 },
  footerText: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.textSoft, lineHeight: 17, textAlign: "center" },
});
