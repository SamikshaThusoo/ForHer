import { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Sparkles, Stethoscope, Salad, Brain, Sun, Trophy, ClipboardCheck, Check, Lock, X, type LucideIcon } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, PLAN_LAST_DAY } from "@/lib/forher/state";
import { personaTrack, getTouchpointsDue, getPhase } from "@/lib/journey";
import { colors, fonts } from "@/theme/tokens";

type NodeType = "start" | "milestone" | "finish" | "retest" | "clinical";
type Item = { day: number; label: string; type: NodeType };
type Group = { day: number; items: Item[]; phase: string; dividerBefore: boolean; i: number };

const PHASE_LABEL: Record<string, string> = { foundation: "Foundation", build: "Build", milestone: "Milestone" };
const PHASE_RANGE: Record<string, string> = { foundation: "Days 1–30", build: "Days 31–60", milestone: "Days 61–90" };
const NODE_DESC: Record<NodeType, string> = {
  start: "Where it all begins — your first day on the plan.",
  milestone: "A milestone in your journey. Keep the streak going!",
  finish: "You complete the 90-day program — time to see what moved.",
  retest: "Bloods + an outcomes review with your doctor.",
  clinical: "A check-in with your care team. We'll remind you the day before.",
};

function meta(items: Item[]): { Icon: LucideIcon; short: string; isMilestone: boolean } {
  const isFinish = items.some((i) => i.type === "finish");
  const isMilestone = items.some((i) => i.type === "milestone" || i.type === "finish");
  const primary = items.find((i) => i.type === "milestone" || i.type === "finish") ?? items[0];
  const lbl = primary.label.toLowerCase();
  let Icon: LucideIcon = Stethoscope, short = primary.label;
  if (isFinish) { Icon = Trophy; short = "Complete"; }
  else if (primary.type === "start") { Icon = Sparkles; short = "Begin"; }
  else if (primary.type === "milestone") { Icon = Trophy; short = primary.label.replace(" complete", "").replace(" phase", ""); }
  else if (primary.type === "retest") { Icon = ClipboardCheck; short = "Retest"; }
  else if (lbl.includes("nutrition")) { Icon = Salad; short = "Nutritionist"; }
  else if (lbl.includes("psych")) { Icon = Brain; short = "Psychologist"; }
  else if (lbl.includes("derm")) { Icon = Sun; short = "Dermatology"; }
  else if (lbl.includes("gynae")) { Icon = Stethoscope; short = "Gynae"; }
  else if (lbl.includes("doctor") || lbl.includes("baseline")) { Icon = Stethoscope; short = "Doctor"; }
  else if (lbl.includes("pre-retest") || lbl.includes("preparation")) { Icon = ClipboardCheck; short = "Pre-retest"; }
  return { Icon, short, isMilestone };
}

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

  const items: Item[] = [];
  for (let d = 1; d <= 90; d++) {
    getTouchpointsDue(persona, d).forEach((t) => {
      if (t.kind === "cc-connect" || d === 90) return;
      items.push({ day: d, label: t.label, type: t.kind === "retest" ? "retest" : "clinical" });
    });
  }
  const milestones: Item[] = [
    { day: 1, label: "Begin your journey", type: "start" },
    { day: 7, label: "First week complete", type: "milestone" },
    { day: 30, label: "Foundation phase complete", type: "milestone" },
    { day: 60, label: "Build phase complete", type: "milestone" },
    { day: 90, label: "90-day program complete", type: "finish" },
  ];
  const byDay = new Map<number, Item[]>();
  [...milestones, ...items].sort((a, b) => a.day - b.day).forEach((it) => {
    if (!byDay.has(it.day)) byDay.set(it.day, []);
    byDay.get(it.day)!.push(it);
  });
  let prevPhase = "";
  const groups: Group[] = [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([d, its], i) => {
    const phase = getPhase(d);
    const dividerBefore = i > 0 && phase !== prevPhase;
    prevPhase = phase;
    return { day: d, items: its, phase, dividerBefore, i };
  });
  const currentIdx = groups.reduce((acc, g, i) => (g.day <= fh.day ? i : acc), 0);

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

      <View style={styles.timeline}>
        {groups.map((g) => {
          const done = g.i < currentIdx, current = g.i === currentIdx, locked = g.i > currentIdx;
          const { Icon, short, isMilestone } = meta(g.items);
          return (
            <View key={g.day}>
              {g.dividerBefore && (
                <View style={styles.divider}><Text style={styles.divPill}>{PHASE_LABEL[g.phase]} · {PHASE_RANGE[g.phase]}</Text></View>
              )}
              <PressableScale onPress={() => setSel(g)} style={styles.row}>
                <View style={styles.rail}>
                  <View style={[styles.line, g.i === 0 && styles.lineHidden]} />
                  <View style={[styles.node, isMilestone && styles.nodeMilestone, done && styles.nodeDone, current && styles.nodeCurrent, locked && styles.nodeLocked]}>
                    {locked ? <Lock size={isMilestone ? 18 : 16} color={colors.textMuted} /> : <Icon size={isMilestone ? 20 : 17} color={current || done ? "#fff" : colors.plumBright} />}
                    {done && <View style={styles.checkBadge}><Check size={9} color="#fff" strokeWidth={3} /></View>}
                  </View>
                  <View style={styles.lineBottom} />
                </View>
                <View style={styles.rowBody}>
                  {current && <Text style={styles.here}>YOU&apos;RE HERE</Text>}
                  <Text style={styles.rowDay}>Day {g.day}</Text>
                  <Text style={[styles.rowLabel, locked && styles.rowLabelLocked]}>{short}</Text>
                </View>
              </PressableScale>
            </View>
          );
        })}
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

  timeline: { marginTop: 16, paddingHorizontal: 18 },
  divider: { alignItems: "flex-start", marginLeft: 52, marginVertical: 6 },
  divPill: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.plumBright, backgroundColor: "rgba(142,83,120,0.1)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, overflow: "hidden" },
  row: { flexDirection: "row", gap: 14 },
  rail: { width: 44, alignItems: "center" },
  line: { position: "absolute", top: 0, height: 22, width: 2, backgroundColor: "rgba(142,83,120,0.2)" },
  lineHidden: { opacity: 0 },
  lineBottom: { flex: 1, width: 2, backgroundColor: "rgba(142,83,120,0.2)", minHeight: 20 },
  node: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1.5, borderColor: "rgba(142,83,120,0.3)", marginTop: 4 },
  nodeMilestone: { width: 48, height: 48, borderRadius: 24 },
  nodeDone: { backgroundColor: colors.plumBright, borderColor: colors.plumBright },
  nodeCurrent: { backgroundColor: colors.plum, borderColor: colors.plum },
  nodeLocked: { backgroundColor: "rgba(91,42,74,0.04)", borderColor: colors.line },
  checkBadge: { position: "absolute", right: -2, bottom: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: "#4F9D69", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#fff" },
  rowBody: { flex: 1, paddingTop: 6, paddingBottom: 14 },
  here: { fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 0.6, color: colors.plum },
  rowDay: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.textMuted, marginTop: 2 },
  rowLabel: { fontSize: 15, fontFamily: fonts.serif, color: colors.plumDeep, marginTop: 1 },
  rowLabelLocked: { color: colors.textMuted },

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
