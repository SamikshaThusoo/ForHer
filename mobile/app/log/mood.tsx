import { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { storage } from "@/lib/storage";
import { colors, fonts } from "@/theme/tokens";

const FEELINGS = ["Energetic", "Calm", "Motivated", "Tired", "Crampy", "Bloated", "Moody", "Anxious"];
const CYCLE = ["Period today", "Spotting", "No bleeding", "Not sure"];
const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

export default function MoodLog() {
  const router = useRouter();
  const [feelings, setFeelings] = useState<Set<string>>(new Set());
  const [cycle, setCycle] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const toggle = (f: string) => setFeelings((p) => { const n = new Set(p); n.has(f) ? n.delete(f) : n.add(f); return n; });
  const save = () => {
    try {
      const arr = JSON.parse(storage.getItem("forher.moodlog.v1") || "[]");
      arr.push({ feelings: [...feelings], cycle, note, day: todayISO(), at: new Date().toISOString() });
      storage.setItem("forher.moodlog.v1", JSON.stringify(arr));
    } catch { /* ignore */ }
    setSaved(true);
  };
  const home = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <Screen>
      <Header title="For Her · PMOS" />
      <View style={styles.body}>
        <Text style={styles.h1}>How are you <Text style={styles.em}>today?</Text></Text>
        <Text style={styles.lead}>A daily check-in keeps your cycle predictions sharp and helps spot patterns over time.</Text>

        <Text style={styles.section}>How do you feel?</Text>
        <View style={styles.chips}>
          {FEELINGS.map((f) => {
            const on = feelings.has(f);
            return <PressableScale key={f} onPress={() => toggle(f)} style={[styles.chip, on && styles.chipOn]}><Text style={[styles.chipText, on && styles.chipTextOn]}>{f}</Text></PressableScale>;
          })}
        </View>

        <Text style={styles.section}>Your cycle</Text>
        <View style={styles.chips}>
          {CYCLE.map((c) => {
            const on = cycle === c;
            return <PressableScale key={c} onPress={() => setCycle(c)} style={[styles.chip, on && styles.chipOn]}><Text style={[styles.chipText, on && styles.chipTextOn]}>{c}</Text></PressableScale>;
          })}
        </View>

        <TextInput style={styles.note} value={note} onChangeText={setNote} placeholder="Anything else worth noting? (optional)" placeholderTextColor={colors.textMuted} multiline />
        <PressableScale onPress={save} style={styles.save}><Text style={styles.saveText}>Save today&apos;s check-in</Text></PressableScale>
      </View>

      <Modal visible={saved} transparent animationType="fade" onRequestClose={home}>
        <Pressable style={styles.modalBg} onPress={home}>
          <View style={styles.modal}>
            <View style={styles.doneMark}><Check size={26} color="#fff" strokeWidth={3} /></View>
            <Text style={styles.doneTitle}>Check-in saved</Text>
            {feelings.size > 0 && <Text style={styles.doneMood}>Feeling {[...feelings].join(", ").toLowerCase()}</Text>}
            {!!cycle && <Text style={styles.doneMood}>{cycle}</Text>}
            <Pressable onPress={home} style={styles.modalCta}><Text style={styles.saveText}>Back to home</Text></Pressable>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 18, paddingTop: 4 },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep },
  em: { fontStyle: "italic", color: colors.plumBright, fontFamily: fonts.serif },
  lead: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 18 },
  section: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13, backgroundColor: "#fff" },
  chipOn: { backgroundColor: colors.plum, borderColor: colors.plum },
  chipText: { fontSize: 12, fontFamily: fonts.sansMedium, color: colors.plum },
  chipTextOn: { color: "#fff" },
  note: { minHeight: 60, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 11, fontSize: 13, fontFamily: fonts.sans, color: colors.text, backgroundColor: "#fff", marginTop: 18, textAlignVertical: "top" },
  save: { backgroundColor: colors.plum, borderRadius: 13, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  saveText: { color: "#fff", fontSize: 14, fontFamily: fonts.sansBold },
  modalBg: { flex: 1, backgroundColor: "rgba(62,27,51,0.4)", alignItems: "center", justifyContent: "center", padding: 30 },
  modal: { width: "100%", maxWidth: 320, backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  doneMark: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#4F9D69", alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 20, fontFamily: fonts.serif, color: colors.plumDeep, marginTop: 14 },
  doneMood: { fontSize: 13, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 4 },
  modalCta: { backgroundColor: colors.plum, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 30, marginTop: 18 },
});
