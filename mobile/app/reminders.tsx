import { useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Bell, ArrowRight, Coffee, Moon, Utensils, HeartPulse, Sun } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/ui/Screen";
import { PressableScale } from "@/components/ui/PressableScale";
import { storage } from "@/lib/storage";
import { colors, fonts } from "@/theme/tokens";

const REMINDERS_KEY = "forher.reminders.v1";

type Reminder = { id: string; label: string; sub: string; time: string; Icon: typeof Bell; enabled: boolean };

const DEFAULT_REMINDERS: Omit<Reminder, "enabled">[] = [
  { id: "morning", label: "Morning card", sub: "Your daily focus card & meal plan", time: "8:00 AM", Icon: Coffee },
  { id: "cycle", label: "Cycle check-in", sub: "Log your flow, symptoms & energy", time: "9:00 AM", Icon: HeartPulse },
  { id: "meal", label: "Meal reminder", sub: "Log lunch & dinner", time: "1:00 PM + 8:00 PM", Icon: Utensils },
  { id: "midday", label: "Midday habit", sub: "Water intake & no-snack check", time: "3:00 PM", Icon: Sun },
  { id: "evening", label: "Evening wind-down", sub: "Mood check-in & tomorrow's plan", time: "9:30 PM", Icon: Moon },
];

const readPrefs = (): Record<string, boolean> => {
  try { return JSON.parse(storage.getItem(REMINDERS_KEY) || "{}"); } catch { return {}; }
};
const savePrefs = (prefs: Record<string, boolean>) => storage.setItem(REMINDERS_KEY, JSON.stringify(prefs));

export default function Reminders() {
  const router = useRouter();
  const saved = readPrefs();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    DEFAULT_REMINDERS.reduce((acc, r) => ({ ...acc, [r.id]: saved[r.id] ?? true }), {} as Record<string, boolean>),
  );

  const toggle = (id: string) => {
    const next = { ...enabled, [id]: !enabled[id] };
    setEnabled(next);
    savePrefs(next);
  };

  const done = () => router.replace("/");

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.bellWrap}><Bell size={26} color={colors.plumBright} /></View>
        <Text style={styles.title}>When should we check in?</Text>
        <Text style={styles.sub}>Choose which reminders to turn on. You can change these anytime in Settings.</Text>
      </View>

      <View style={styles.list}>
        {DEFAULT_REMINDERS.map(({ id, label, sub, time, Icon }) => (
          <View key={id} style={styles.row}>
            <View style={styles.rowIcon}><Icon size={17} color={colors.plumBright} /></View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowSub}>{sub}</Text>
              <Text style={styles.rowTime}>{time}</Text>
            </View>
            <Switch
              value={!!enabled[id]}
              onValueChange={() => toggle(id)}
              trackColor={{ false: "rgba(91,42,74,0.1)", true: colors.plumBright }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerNote}>Reminders are shown as app notifications. We&apos;ll ask for permission when you first open the app.</Text>
        <PressableScale onPress={done} style={styles.cta}>
          <LinearGradient colors={[colors.plum, colors.plumBright]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGrad}>
            <Text style={styles.ctaText}>Start my plan</Text>
            <ArrowRight size={16} color="#fff" />
          </LinearGradient>
        </PressableScale>
        <PressableScale onPress={done} style={styles.skip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, gap: 8 },
  bellWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(142,83,120,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { fontSize: 22, fontFamily: fonts.serif, color: colors.plumDeep, textAlign: "center" },
  sub: { fontSize: 13, fontFamily: fonts.sans, color: colors.textSoft, textAlign: "center", lineHeight: 18 },

  list: { marginTop: 10, paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.07)" },
  rowBody: { flex: 1, gap: 1 },
  rowLabel: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  rowSub: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.textSoft },
  rowTime: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.plumBright, marginTop: 2 },

  footer: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  footerNote: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, textAlign: "center", lineHeight: 16 },
  cta: { borderRadius: 14, overflow: "hidden" },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  ctaText: { fontSize: 15, fontFamily: fonts.sansBold, color: "#fff" },
  skip: { alignItems: "center", paddingVertical: 8 },
  skipText: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.textSoft },
});
