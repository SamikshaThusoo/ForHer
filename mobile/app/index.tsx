import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  CalendarHeart, Activity, MessagesSquare, Utensils, Route, Stethoscope, TrendingUp, BookOpen,
  type LucideIcon,
} from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { colors, fonts, phaseAccent } from "@/theme/tokens";
import type { CyclePhase } from "@/types/journey";

const NAV: { href: string; label: string; sub: string; Icon: LucideIcon }[] = [
  { href: "/cycle", label: "Cycle", sub: "Calendar, phase & predictions", Icon: CalendarHeart },
  { href: "/hormones", label: "Hormone rhythm", sub: "How your hormones move", Icon: Activity },
  { href: "/community", label: "Community", sub: "Women in your phase", Icon: MessagesSquare },
  { href: "/food", label: "Food", sub: "Log meals & your plan", Icon: Utensils },
  { href: "/plan", label: "Your plan", sub: "Your 90-day journey", Icon: Route },
  { href: "/clinic", label: "Clinic", sub: "Your care team & visits", Icon: Stethoscope },
  { href: "/progress", label: "Progress", sub: "Daily & milestones", Icon: TrendingUp },
  { href: "/learn", label: "Learn", sub: "Understand PCOS", Icon: BookOpen },
];

export default function Home() {
  const router = useRouter();
  const { persona, allPersonas, setPersonaId } = usePersona();
  const fh = useForHer(persona.id);
  const today = new Date();
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const lp = fh.cycleLog?.lastPeriod;
  const phase: CyclePhase | null = lp
    ? phaseForCycleDay(cycleDayFromLog(lp, L, today), L, fh.cycleLog?.duration ?? 5)
    : null;
  const accent = phaseAccent[phase ?? "follicular"];

  return (
    <Screen>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.personas}>
        {allPersonas.map((p) => {
          const on = p.id === persona.id;
          return (
            <Pressable key={p.id} onPress={() => setPersonaId(p.id)} style={[styles.persona, on && styles.personaOn]}>
              <Text style={[styles.personaText, on && styles.personaTextOn]}>{p.shortName}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.hero}>
        <Text style={styles.brand}>For Her · PMOS</Text>
        <Text style={styles.h1}>Hi {persona.shortName}</Text>
        <Text style={styles.sub}>
          {phase ? `You're in your ${PHASE_LABEL[phase].toLowerCase()} phase` : "Log your cycle to see your phase"}
        </Text>
      </View>

      <View style={styles.grid}>
        {NAV.map((n) => (
          <Pressable key={n.href} onPress={() => router.push(n.href as never)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={[styles.cardIcon, { backgroundColor: accent.soft }]}>
              <n.Icon size={22} color={accent.deep} />
            </View>
            <Text style={styles.cardTitle}>{n.label}</Text>
            <Text style={styles.cardSub}>{n.sub}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  personas: { gap: 8, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 4 },
  persona: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong },
  personaOn: { backgroundColor: colors.plum, borderColor: colors.plum },
  personaText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.plum },
  personaTextOn: { color: "#fff" },

  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  brand: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.plumBright, letterSpacing: 0.3 },
  h1: { fontSize: 30, fontFamily: fonts.serif, color: colors.plumDeep, marginTop: 6 },
  sub: { fontSize: 13.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 5 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  card: {
    width: "47%", backgroundColor: colors.surface, borderRadius: 18, padding: 15,
    borderWidth: 1, borderColor: colors.line, shadowColor: "#5B2A4A", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  cardPressed: { transform: [{ scale: 0.98 }] },
  cardIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  cardTitle: { fontSize: 16, fontFamily: fonts.serif, color: colors.plumDeep },
  cardSub: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 4, lineHeight: 15 },
});
