import { useState } from "react";
import { View, Text, Switch, StyleSheet, Platform, Pressable } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Bell, ArrowRight, Coffee, Moon, Utensils, HeartPulse, Sun, Pencil } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/ui/Screen";
import { PressableScale } from "@/components/ui/PressableScale";
import { storage } from "@/lib/storage";
import { colors, fonts } from "@/theme/tokens";

const REMINDERS_KEY = "forher.reminders.v2";
const LEGACY_KEY = "forher.reminders.v1"; // enabled-only prefs from before times were editable

// Times are stored canonically as "HH:mm" (24h) and displayed as h:mm AM/PM.
const DEFAULT_REMINDERS = [
  { id: "morning", label: "Morning card", sub: "Your daily focus card & meal plan", times: ["08:00"], Icon: Coffee },
  { id: "cycle", label: "Cycle check-in", sub: "Log your flow, symptoms & energy", times: ["09:00"], Icon: HeartPulse },
  { id: "meal", label: "Meal reminder", sub: "Log lunch & dinner", times: ["13:00", "20:00"], Icon: Utensils },
  { id: "midday", label: "Midday habit", sub: "Water intake & no-snack check", times: ["15:00"], Icon: Sun },
  { id: "evening", label: "Evening wind-down", sub: "Mood check-in & tomorrow's plan", times: ["21:30"], Icon: Moon },
];

type Prefs = Record<string, { enabled: boolean; times: string[] }>;

const pad = (n: number) => String(n).padStart(2, "0");
const displayTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
};
const timeToDate = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

const readPrefs = (): Prefs => {
  try {
    const v2 = JSON.parse(storage.getItem(REMINDERS_KEY) || "null");
    if (v2) return v2;
  } catch { /* fall through to defaults */ }
  let legacy: Record<string, boolean> = {};
  try { legacy = JSON.parse(storage.getItem(LEGACY_KEY) || "{}"); } catch { /* defaults */ }
  return DEFAULT_REMINDERS.reduce((acc, r) => ({
    ...acc, [r.id]: { enabled: legacy[r.id] ?? true, times: r.times },
  }), {} as Prefs);
};
const savePrefs = (prefs: Prefs) => storage.setItem(REMINDERS_KEY, JSON.stringify(prefs));

export default function Reminders() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [picking, setPicking] = useState<{ id: string; idx: number } | null>(null);

  const update = (next: Prefs) => { setPrefs(next); savePrefs(next); };

  const toggle = (id: string) =>
    update({ ...prefs, [id]: { ...prefs[id], enabled: !prefs[id].enabled } });

  const setTime = (id: string, idx: number, d: Date) => {
    const times = [...prefs[id].times];
    times[idx] = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    update({ ...prefs, [id]: { ...prefs[id], times } });
  };

  const done = () => router.replace("/");

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.bellWrap}><Bell size={26} color={colors.plumBright} /></View>
        <Text style={styles.title}>When should we check in?</Text>
        <Text style={styles.sub}>Choose which reminders to turn on and tap a time to change it. You can adjust these anytime in Settings.</Text>
      </View>

      <View style={styles.list}>
        {DEFAULT_REMINDERS.map(({ id, label, sub, Icon }) => {
          const p = prefs[id];
          return (
            <View key={id} style={styles.row}>
              <View style={styles.rowIcon}><Icon size={17} color={colors.plumBright} /></View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowSub}>{sub}</Text>
                <View style={styles.times}>
                  {p.times.map((t, idx) => (
                    <Pressable key={idx} onPress={() => setPicking({ id, idx })}
                      style={[styles.timeChip, !p.enabled && styles.timeChipOff]}>
                      <Text style={styles.timeText}>{displayTime(t)}</Text>
                      <Pencil size={10} color={colors.plumBright} />
                    </Pressable>
                  ))}
                </View>
              </View>
              <Switch
                value={p.enabled}
                onValueChange={() => toggle(id)}
                trackColor={{ false: "rgba(91,42,74,0.1)", true: colors.plumBright }}
                thumbColor="#fff"
              />
            </View>
          );
        })}
      </View>

      {picking && (
        <DateTimePicker
          value={timeToDate(prefs[picking.id].times[picking.idx])}
          mode="time"
          onChange={(_e, d) => {
            const target = picking;
            setPicking(Platform.OS === "ios" ? picking : null);
            if (d && target) setTime(target.id, target.idx, d);
          }}
        />
      )}

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
  times: { flexDirection: "row", gap: 6, marginTop: 5 },
  timeChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(142,83,120,0.09)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10,
  },
  timeChipOff: { opacity: 0.45 },
  timeText: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.plumBright },

  footer: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  footerNote: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, textAlign: "center", lineHeight: 16 },
  cta: { borderRadius: 14, overflow: "hidden" },
  ctaGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  ctaText: { fontSize: 15, fontFamily: fonts.sansBold, color: "#fff" },
  skip: { alignItems: "center", paddingVertical: 8 },
  skipText: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.textSoft },
});
