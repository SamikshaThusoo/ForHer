import { useState } from "react";
import { View, Text, Pressable, TextInput, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Droplet, Sparkles, HeartPulse, Baby, ArrowLeft, type LucideIcon } from "lucide-react-native";
import type { CycleIntent, CycleLog } from "@/lib/forher/state";
import { colors, fonts } from "@/theme/tokens";

const pad = (n: number) => String(n).padStart(2, "0");
const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

const INTENTS: { key: CycleIntent; label: string; sub: string; Icon: LucideIcon }[] = [
  { key: "track", label: "Just tracking", sub: "Understand my cycle, hormones and symptoms.", Icon: Sparkles },
  { key: "ttc", label: "Trying to conceive", sub: "Help me spot my fertile days.", Icon: HeartPulse },
  { key: "pregnant", label: "I'm pregnant", sub: "Support me through pregnancy with PCOS.", Icon: Baby },
];

/** Tracker setup: intent, then the details that unlock predictions. */
export function CycleOnboarding({ onSave }: { onSave: (log: CycleLog) => void }) {
  const [intent, setIntent] = useState<CycleIntent | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dur, setDur] = useState(0);
  const [len, setLen] = useState("28");
  const [weeks, setWeeks] = useState("");

  if (!intent) {
    return (
      <View style={styles.card}>
        <View style={styles.icon}><Droplet size={22} color={colors.plumBright} /></View>
        <Text style={styles.title}>Let&apos;s set up your tracker</Text>
        <Text style={styles.sub}>First — why are you here? Your cards adapt to your answer.</Text>
        <View style={styles.intents}>
          {INTENTS.map((it) => (
            <Pressable key={it.key} onPress={() => setIntent(it.key)} style={styles.intent}>
              <View style={styles.intentIcon}><it.Icon size={18} color={colors.plumBright} /></View>
              <View style={styles.intentText}>
                <Text style={styles.intentLabel}>{it.label}</Text>
                <Text style={styles.intentSub}>{it.sub}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  if (intent === "pregnant") {
    const w = Number(weeks);
    return (
      <View style={styles.card}>
        <Pressable onPress={() => setIntent(null)} style={styles.back}><ArrowLeft size={14} color={colors.textSoft} /><Text style={styles.backText}>Back</Text></Pressable>
        <Text style={styles.title}>Congratulations</Text>
        <Text style={styles.sub}>We&apos;ll skip cycle tracking and focus on you and your pregnancy.</Text>
        <Text style={styles.label}>How far along are you?</Text>
        <View style={styles.numRow}>
          <TextInput style={styles.numInput} keyboardType="number-pad" value={weeks} onChangeText={setWeeks} placeholder="0" placeholderTextColor={colors.textMuted} />
          <Text style={styles.numUnit}>weeks</Text>
        </View>
        <Pressable disabled={!(w > 0 && w <= 42)} onPress={() => onSave({ intent, weeksPregnant: w })} style={[styles.save, !(w > 0 && w <= 42) && styles.saveOff]}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>
    );
  }

  const lenN = Number(len);
  const valid = !!date && dur > 0 && Number.isInteger(lenN) && lenN >= 20 && lenN <= 90;
  return (
    <View style={styles.card}>
      <Pressable onPress={() => setIntent(null)} style={styles.back}><ArrowLeft size={14} color={colors.textSoft} /><Text style={styles.backText}>Back</Text></Pressable>
      <Text style={styles.title}>{intent === "ttc" ? "Let's map your fertile window" : "Let's set up your cycle"}</Text>
      <Text style={styles.sub}>A few quick details and we can predict your phases{intent === "ttc" ? " and fertile days" : ""}.</Text>

      <Text style={styles.label}>When did your last period start?</Text>
      <Pressable onPress={() => setShowPicker(true)} style={styles.dateBtn}>
        <Text style={[styles.dateText, !date && styles.datePlaceholder]}>{date ? fmt(date) : "Pick a date"}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker value={date ?? new Date()} mode="date" maximumDate={new Date()}
          onChange={(_e, d) => { setShowPicker(Platform.OS === "ios"); if (d) setDate(d); }} />
      )}

      <Text style={styles.label}>How many days does it usually last?</Text>
      <View style={styles.chips}>
        {[3, 4, 5, 6, 7].map((d) => (
          <Pressable key={d} onPress={() => setDur(d)} style={[styles.chip, dur === d && styles.chipOn]}>
            <Text style={[styles.chipText, dur === d && styles.chipTextOn]}>{d === 7 ? "7+" : d}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>How long is your cycle, usually?</Text>
      <Text style={styles.subSmall}>Count from the first day of one period to the first day of the next. Most cycles are 21 to 35 days.</Text>
      <View style={styles.numRow}>
        <TextInput style={styles.numInput} keyboardType="number-pad" value={len} onChangeText={setLen} placeholder="28" placeholderTextColor={colors.textMuted} />
        <Text style={styles.numUnit}>days</Text>
      </View>

      <Pressable disabled={!valid} onPress={() => date && onSave({ intent, lastPeriod: localISO(date), duration: dur, cycleLength: lenN })} style={[styles.save, !valid && styles.saveOff]}>
        <Text style={styles.saveText}>Save my cycle</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 18, marginTop: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 18 },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)", marginBottom: 10 },
  title: { fontSize: 20, fontFamily: fonts.serif, color: colors.plumDeep },
  sub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 6, lineHeight: 18 },
  subSmall: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 4, lineHeight: 16 },
  intents: { marginTop: 14, gap: 10 },
  intent: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13 },
  intentIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)" },
  intentText: { flex: 1 },
  intentLabel: { fontSize: 14.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  intentSub: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2 },
  back: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", marginBottom: 8 },
  backText: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.textSoft },
  label: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 16 },
  dateBtn: { borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginTop: 8, backgroundColor: "#fff" },
  dateText: { fontSize: 14, fontFamily: fonts.sansMedium, color: colors.plumDeep },
  datePlaceholder: { color: colors.textMuted, fontFamily: fonts.sans },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { minWidth: 44, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, alignItems: "center", backgroundColor: "#fff" },
  chipOn: { backgroundColor: colors.plum, borderColor: colors.plum },
  chipText: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.plumDeep },
  chipTextOn: { color: "#fff" },
  numRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  numInput: { width: 80, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, fontSize: 16, fontFamily: fonts.sansBold, color: colors.plumDeep, backgroundColor: "#fff", textAlign: "center" },
  numUnit: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.textSoft },
  save: { backgroundColor: colors.plum, borderRadius: 13, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveOff: { opacity: 0.5 },
  saveText: { color: "#fff", fontSize: 14.5, fontFamily: fonts.sansBold },
});
