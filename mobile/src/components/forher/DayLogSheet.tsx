import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { FLOWS, SYMPTOM_GROUPS, isEmptyEntry, type DayEntry, type Flow } from "@/lib/forher/daylog";
import { colors, fonts } from "@/theme/tokens";

/** Bottom sheet for logging a day's flow + symptoms. A flow marks the period day;
 *  symptoms are structured, multi-select, on/off. */
export function DayLogSheet({ dateISO, entry, labelDate, onSave, onClose }: {
  dateISO: string | null;
  entry: DayEntry;
  labelDate: string;
  onSave: (iso: string, entry: DayEntry) => void;
  onClose: () => void;
}) {
  const open = dateISO !== null;
  const [flow, setFlow] = useState<Flow | undefined>(entry.flow);
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set(entry.symptoms ?? []));

  useEffect(() => {
    if (dateISO !== null) { setFlow(entry.flow); setSymptoms(new Set(entry.symptoms ?? [])); }
  }, [dateISO]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSymptom = (id: string) => setSymptoms((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const commit = () => { if (dateISO === null) return; onSave(dateISO, { period: !!flow, flow, symptoms: [...symptoms] }); onClose(); };
  const draftEmpty = isEmptyEntry({ period: !!flow, flow, symptoms: [...symptoms] });

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grab} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Log your day</Text>
              <Text style={styles.title}>{labelDate}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}><X size={18} color={colors.textSoft} /></Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Flow</Text>
            <View style={styles.chips}>
              {FLOWS.map((f) => <Chip key={f.id} label={f.label} on={flow === f.id} onPress={() => setFlow((c) => (c === f.id ? undefined : f.id))} />)}
              <Chip label="None" on={flow === undefined} onPress={() => setFlow(undefined)} />
            </View>
            <Text style={styles.hint}>A flow marks this as a period day.</Text>

            {SYMPTOM_GROUPS.map((g) => (
              <View key={g.group}>
                <Text style={styles.sectionLabel}>{g.group}</Text>
                <View style={styles.chips}>
                  {g.items.map((s) => <Chip key={s.id} label={s.label} on={symptoms.has(s.id)} onPress={() => toggleSymptom(s.id)} />)}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.saveBar}>
            <Pressable onPress={commit} style={styles.save}><Text style={styles.saveText}>{draftEmpty ? "Clear day" : "Save"}</Text></Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(62,27,51,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FBF3F5", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 28, maxHeight: "88%" },
  grab: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(91,42,74,0.2)", marginTop: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8 },
  eyebrow: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright },
  title: { fontSize: 19, fontFamily: fonts.serif, color: colors.plumDeep, marginTop: 2 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line },
  content: { paddingHorizontal: 18 },
  sectionLabel: { fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.textMuted, marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13, backgroundColor: "#fff" },
  chipOn: { backgroundColor: colors.plum, borderColor: colors.plum },
  chipText: { fontSize: 12, fontFamily: fonts.sansMedium, color: colors.plum },
  chipTextOn: { color: "#fff" },
  hint: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 8 },
  saveBar: { paddingHorizontal: 18, paddingTop: 12 },
  save: { backgroundColor: colors.plum, borderRadius: 13, paddingVertical: 14, alignItems: "center" },
  saveText: { color: "#fff", fontSize: 14.5, fontFamily: fonts.sansBold },
});
