import { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, PLAN_LAST_DAY } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import { JourneyRoadmap, type Group } from "@/components/forher/JourneyRoadmap";
import { colors, fonts } from "@/theme/tokens";

type NodeType = "start" | "milestone" | "finish" | "retest" | "clinical";
const NODE_DESC: Record<NodeType, string> = {
  start: "Where it all begins — your first day on the plan.",
  milestone: "A milestone in your journey. Keep the streak going!",
  finish: "You complete the 90-day program — time to see what moved.",
  retest: "Bloods + an outcomes review with your doctor.",
  clinical: "A check-in with your care team. We'll remind you the day before.",
};

export default function Plan() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const track = personaTrack(persona);
  const [sel, setSel] = useState<Group | null>(null);

  if (!persona.pmos?.eligible || track === "none") {
    return (
      <Screen>
        <Header title="For Her · PMOS" />
        <View style={styles.empty}>
          <Text style={styles.h1}>No care-plan journey</Text>
          <Text style={styles.emptySub}>You&apos;re on the companion track — keep tracking your cycle, mood and habits, and we&apos;ll re-check over time.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="For Her · PMOS" />
      <View style={styles.hero}>
        <Text style={styles.h1}>Your 90-day <Text style={styles.h1em}>journey</Text></Text>
        <Text style={styles.jSub}>Each step is a milestone or a check-in with your care team. You&apos;re on Day {fh.day}.</Text>
      </View>

      <View style={styles.scrub}>
        <Text style={styles.dayNum}>Day {fh.day}<Text style={styles.dayTot}> / {PLAN_LAST_DAY}</Text></Text>
        <DayScrubber value={fh.day} max={PLAN_LAST_DAY} onChange={fh.setDay} />
      </View>

      <View style={styles.roadWrap}>
        <JourneyRoadmap persona={persona} day={fh.day} onSelect={setSel} />
      </View>

      <Text style={styles.disclaimer}>Your care team makes any clinical calls — these dates are when they check in.</Text>

      <Modal visible={!!sel} transparent animationType="fade" onRequestClose={() => setSel(null)}>
        <Pressable style={styles.modalBg} onPress={() => setSel(null)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Pressable style={styles.modalClose} onPress={() => setSel(null)}><X size={16} color={colors.textSoft} /></Pressable>
            <Text style={styles.modalDay}>Day {sel?.day}</Text>
            {sel?.items.map((it, i) => (
              <View key={i} style={styles.modalItem}>
                <Text style={styles.modalTitle}>{it.label}</Text>
                <Text style={styles.modalSub}>{NODE_DESC[it.type]}</Text>
              </View>
            ))}
            <Pressable style={styles.modalBtn} onPress={() => setSel(null)}><Text style={styles.modalBtnText}>Got it</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function DayScrubber({ value, max, onChange }: { value: number; max: number; onChange: (d: number) => void }) {
  const [w, setW] = useState(0);
  const update = (x: number) => { if (w > 0) onChange(Math.round(1 + Math.max(0, Math.min(1, x / w)) * (max - 1))); };
  const left = w > 0 ? ((value - 1) / (max - 1)) * w : 0;
  return (
    <View style={styles.trackHit} onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => update(e.nativeEvent.locationX)} onResponderMove={(e) => update(e.nativeEvent.locationX)}>
      <View style={styles.trackBar} />
      <View pointerEvents="none" style={[styles.thumb, { left: left - 11 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8 },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep },
  h1em: { fontFamily: fonts.serif, fontStyle: "italic", color: colors.plumBright },
  jSub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 18 },
  empty: { padding: 30, alignItems: "center" },
  emptySub: { fontSize: 13, fontFamily: fonts.sans, color: colors.textSoft, textAlign: "center", marginTop: 10, lineHeight: 19 },

  scrub: { marginHorizontal: 18, marginTop: 6 },
  dayNum: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.plumDeep, marginBottom: 6 },
  dayTot: { color: colors.textMuted, fontFamily: fonts.sansMedium },
  trackHit: { height: 24, justifyContent: "center" },
  trackBar: { height: 8, borderRadius: 999, backgroundColor: "rgba(142,83,120,0.18)" },
  thumb: { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, borderColor: "#fff", backgroundColor: colors.plumBright, top: 2 },

  roadWrap: { marginTop: 12, paddingHorizontal: 12 },

  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginHorizontal: 22, marginTop: 12, lineHeight: 14 },

  modalBg: { flex: 1, backgroundColor: "rgba(62,27,51,0.4)", alignItems: "center", justifyContent: "center", padding: 30 },
  modal: { width: "100%", maxWidth: 340, backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalClose: { position: "absolute", right: 12, top: 12, padding: 4 },
  modalDay: { fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright },
  modalItem: { marginTop: 10 },
  modalTitle: { fontSize: 17, fontFamily: fonts.serif, color: colors.plumDeep },
  modalSub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 4, lineHeight: 18 },
  modalBtn: { marginTop: 18, backgroundColor: colors.plum, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  modalBtnText: { color: "#fff", fontSize: 14, fontFamily: fonts.sansBold },
});
