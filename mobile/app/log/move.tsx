import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { storage } from "@/lib/storage";
import { colors, fonts, gradients } from "@/theme/tokens";

function SaveButton({ label, onPress, disabled, style }: { label: string; onPress: () => void; disabled?: boolean; style?: object }) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} style={[styles.saveWrap, disabled && styles.saveOff, style]}>
      <LinearGradient colors={gradients.plum} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.save}>
        <Text style={styles.saveText}>{label}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

const KINDS = ["Walk", "Yoga", "Strength", "Cardio", "Dance", "Cycling"];
const MINUTES = [10, 20, 30, 45];
const STEPS = [2000, 5000, 8000, 10000];

export default function MoveLog() {
  const router = useRouter();
  const [steps, setSteps] = useState<number | null>(null);
  const [kind, setKind] = useState("");
  const [mins, setMins] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const save = () => {
    try {
      const arr = JSON.parse(storage.getItem("forher.movelog.v1") || "[]");
      arr.push({ steps, kind, mins, at: new Date().toISOString() });
      storage.setItem("forher.movelog.v1", JSON.stringify(arr));
    } catch { /* ignore */ }
    setSaved(true);
  };
  const home = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (saved) {
    return (
      <Screen>
        <Header title="For Her · PMOS" />
        <View style={styles.doneWrap}>
          <View style={styles.doneMark}><Check size={26} color="#fff" strokeWidth={3} /></View>
          <Text style={styles.doneTitle}>Nice work</Text>
          <Text style={styles.doneSub}>Logged for today. Small, steady movement adds up with PMOS.</Text>
          <SaveButton label="Back home" onPress={home} style={{ marginTop: 20, alignSelf: "stretch" }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="For Her · PMOS" />
      <View style={styles.body}>
        <Text style={styles.h1}>Log your <Text style={styles.em}>movement</Text></Text>
        <Text style={styles.lead}>Any movement counts — steady activity helps insulin sensitivity, even without weight change.</Text>

        <Text style={styles.section}>Steps so far</Text>
        <View style={styles.chips}>
          {STEPS.map((s) => {
            const on = steps === s;
            return <PressableScale key={s} onPress={() => setSteps(s)} style={[styles.chip, on && styles.chipOn]}><Text style={[styles.chipText, on && styles.chipTextOn]}>{s.toLocaleString()}</Text></PressableScale>;
          })}
        </View>

        <Text style={styles.section}>A session today?</Text>
        <View style={styles.chips}>
          {KINDS.map((k) => {
            const on = kind === k;
            return <PressableScale key={k} onPress={() => setKind(k)} style={[styles.chip, on && styles.chipOn]}><Text style={[styles.chipText, on && styles.chipTextOn]}>{k}</Text></PressableScale>;
          })}
        </View>

        {!!kind && (
          <>
            <Text style={styles.section}>For how long?</Text>
            <View style={styles.chips}>
              {MINUTES.map((m) => {
                const on = mins === m;
                return <PressableScale key={m} onPress={() => setMins(m)} style={[styles.chip, on && styles.chipOn]}><Text style={[styles.chipText, on && styles.chipTextOn]}>{m} min</Text></PressableScale>;
              })}
            </View>
          </>
        )}

        <SaveButton label="Log movement" onPress={save} disabled={steps === null && !kind} />
      </View>
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
  saveWrap: { marginTop: 22, borderRadius: 999, overflow: "hidden", shadowColor: "#5B2A4A", shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  save: { paddingVertical: 14, alignItems: "center" },
  saveOff: { opacity: 0.5 },
  saveText: { color: "#fff", fontSize: 14, fontFamily: fonts.sansBold },
  doneWrap: { alignItems: "center", padding: 30, paddingTop: 50 },
  doneMark: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#4F9D69", alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 22, fontFamily: fonts.serif, color: colors.plumDeep, marginTop: 14 },
  doneSub: { fontSize: 13, fontFamily: fonts.sans, color: colors.textSoft, textAlign: "center", marginTop: 8, lineHeight: 19 },
});
