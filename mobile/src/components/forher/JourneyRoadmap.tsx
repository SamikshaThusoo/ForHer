import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, useReducedMotion } from "react-native-reanimated";
import { useEffect } from "react";
import {
  Sparkles, Stethoscope, Salad, Brain, Sun, Trophy, ClipboardCheck, Check, Lock, type LucideIcon,
} from "lucide-react-native";
import { getTouchpointsDue, getPhase } from "@/lib/journey";
import type { Persona } from "@/types/persona";
import { fonts } from "@/theme/tokens";

type NodeType = "start" | "milestone" | "finish" | "retest" | "clinical";
type Item = { day: number; label: string; type: NodeType };
export type Group = { day: number; items: Item[] };

const PHASE_LABEL: Record<string, string> = { foundation: "Foundation", build: "Build", milestone: "Milestone" };
const PHASE_RANGE: Record<string, string> = { foundation: "Days 1–30", build: "Days 31–60", milestone: "Days 61–90" };

function meta(items: Item[]) {
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

const W = 360, CX = 180, AMP = 48, PITCH = 138, TOP = 82, DIV = 80, BOT = 28;

/** Pulsing halo behind the current node (RN stand-in for the CSS box-shadow pulse). */
function PulseRing({ size }: { size: number }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    p.value = withRepeat(withTiming(1, { duration: 1900 }), -1, false);
  }, [reduce, p]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.value * 0.35 }],
    opacity: 0.22 * (1 - p.value),
  }));
  return <Animated.View pointerEvents="none" style={[styles.pulse, { width: size, height: size, borderRadius: size / 2 }, anim]} />;
}

/** The gamified 90-day journey: one serpentine SVG path with evenly-pitched nodes,
 *  phase dividers, a "you're here" marker, and a tap → detail popup. */
export function JourneyRoadmap({ persona, day, onSelect }: { persona: Persona; day: number; onSelect: (g: Group) => void }) {
  const [cw, setCw] = useState(0);

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
  const groups = [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([d, its]) => ({ day: d, items: its }));

  let prevPhase = "", divCount = 0;
  const placed = groups.map((g, i) => {
    const phase = getPhase(g.day);
    let dividerBefore = false;
    if (phase !== prevPhase) { if (i > 0) { dividerBefore = true; divCount++; } prevPhase = phase; }
    return { ...g, phase, dividerBefore, i, x: CX + AMP * Math.sin(i * 0.8), y: TOP + i * PITCH + divCount * DIV };
  });
  const totalH = TOP + groups.length * PITCH + divCount * DIV + BOT;
  const currentIdx = placed.reduce((acc, g, i) => (g.day <= day ? i : acc), 0);

  const buildPath = (subset: typeof placed) => {
    let d = "", pp = "";
    subset.forEach((n, k) => {
      if (n.phase !== pp) d += ` M ${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
      else {
        const prev = subset[k - 1];
        const my = ((prev.y + n.y) / 2).toFixed(1);
        d += ` C ${prev.x.toFixed(1)} ${my} ${n.x.toFixed(1)} ${my} ${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
      }
      pp = n.phase;
    });
    return d.trim();
  };
  const mutedD = buildPath(placed);
  const doneD = buildPath(placed.slice(0, currentIdx + 1));

  return (
    <View style={[styles.path, { height: totalH }]} onLayout={(e) => setCw(e.nativeEvent.layout.width)}>
      {cw > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={cw} height={totalH} viewBox={`0 0 ${W} ${totalH}`} preserveAspectRatio="none">
          <Defs>
            <SvgGradient id="fhRoad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#B5687E" /><Stop offset="1" stopColor="#5B2A4A" />
            </SvgGradient>
          </Defs>
          <Path d={mutedD} fill="none" stroke="rgba(142,83,120,0.16)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <Path d={doneD} fill="none" stroke="url(#fhRoad)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </Svg>
      )}

      {placed.filter((p) => p.dividerBefore).map((p) => (
        <View key={`div-${p.phase}`} style={[styles.divider, { top: p.y - (p.items.some((i) => i.type === "milestone" || i.type === "finish") ? 40 : 32) - 48 }]}>
          <Text style={styles.divPill}>{PHASE_LABEL[p.phase]} · {PHASE_RANGE[p.phase]}</Text>
        </View>
      ))}

      {placed.map((p) => {
        const done = p.i < currentIdx, current = p.i === currentIdx, locked = p.i > currentIdx;
        const { Icon, short, isMilestone } = meta(p.items);
        const size = isMilestone ? 80 : 64, r = size / 2;
        const iconSize = isMilestone ? 30 : 24;
        const xPct = `${(p.x / W) * 100}%` as const;
        return (
          <View key={p.day}>
            <Pressable onPress={() => onSelect(p)} style={[styles.node, { left: xPct, top: p.y, width: size, height: size, borderRadius: r, marginLeft: -r, marginTop: -r }]}>
              {current && <PulseRing size={size + 8} />}
              {done || current ? (
                <LinearGradient colors={["#B5687E", "#5B2A4A"]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.fill, { borderRadius: r }, isMilestone && styles.milestoneBorder]} />
              ) : (
                <View style={[styles.fill, styles.lockedFill, { borderRadius: r }, isMilestone && styles.milestoneBorder]} />
              )}
              {locked ? (
                <>
                  <Icon size={iconSize} color="rgba(120,108,116,0.35)" />
                  <View style={styles.lockOverlay}><Lock size={iconSize} color="#5E5059" strokeWidth={2.4} /></View>
                </>
              ) : (
                <Icon size={iconSize} color="#fff" />
              )}
              {done && <View style={styles.checkBadge}><Check size={11} color="#fff" strokeWidth={3} /></View>}
            </Pressable>

            {current && (
              <View style={[styles.hereBubble, { left: xPct, top: p.y - r - 24 }]}>
                <Text style={styles.hereText}>YOU&apos;RE HERE</Text>
                <View style={styles.hereArrow} />
              </View>
            )}

            <View style={[styles.label, { left: xPct, top: p.y + r + 18 }]}>
              <Text style={styles.labelDay}>DAY {p.day}</Text>
              <Text style={styles.labelShort}>{short}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  path: { position: "relative", width: "100%", maxWidth: 420, alignSelf: "center", marginVertical: 6 },

  divider: { position: "absolute", left: 0, right: 0, alignItems: "center", transform: [{ translateY: -12 }], zIndex: 3 },
  divPill: {
    fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.7, textTransform: "uppercase", color: "#fff",
    borderRadius: 999, paddingVertical: 6, paddingHorizontal: 16, overflow: "hidden", backgroundColor: "#B5532F",
    shadowColor: "#9B4426", shadowOpacity: 0.4, shadowRadius: 0, shadowOffset: { width: 0, height: 3 },
  },

  node: { position: "absolute", alignItems: "center", justifyContent: "center", zIndex: 2 },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  milestoneBorder: { borderWidth: 3, borderColor: "#F2C14E" },
  lockedFill: { backgroundColor: "#E4DAE2" },
  pulse: { position: "absolute", top: -4, left: -4, backgroundColor: "#8E5378" },
  lockOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  checkBadge: { position: "absolute", top: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: "#4F9D69", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },

  hereBubble: { position: "absolute", transform: [{ translateX: "-50%" }], zIndex: 4, backgroundColor: "#C9772A", borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, alignItems: "center" },
  hereText: { fontSize: 9, fontFamily: fonts.sansBold, letterSpacing: 0.6, color: "#fff" },
  hereArrow: { position: "absolute", bottom: -4, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 4, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#C9772A" },

  label: { position: "absolute", transform: [{ translateX: "-50%" }], zIndex: 5, maxWidth: 132, alignItems: "center", backgroundColor: "rgba(251,243,245,0.94)", borderRadius: 9, paddingVertical: 3, paddingHorizontal: 9 },
  labelDay: { fontSize: 8.5, fontFamily: fonts.sansBold, letterSpacing: 0.6, color: "#A9929F" },
  labelShort: { fontSize: 12, fontFamily: fonts.sansBold, color: "#3E1B33", lineHeight: 15 },
});
