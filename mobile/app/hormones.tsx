import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Path, Line, Circle, Defs, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import {
  cycleLengthFor, cycleDayFromLog, phaseForCycleDay, ovulationDay, hormoneModel,
  PHASE_LABEL, PHASE_PROSE, HORMONES, type HormoneKey,
} from "@/lib/forher/cycleview";
import { colors, fonts } from "@/theme/tokens";
import type { CyclePhase } from "@/types/journey";

const W = 320, H = 116, PAD = 6;

const ATMOSPHERE: Record<CyclePhase, string> = {
  menstrual: "#C76B7A", follicular: "#C9A24A", ovulatory: "#2F7A7A", luteal: "#8E5378",
};
const HUE: Record<string, string> = {
  estrogen: "#C76B7A", progesterone: "#8E5378", lh: "#D98324", testosterone: "#2E6E8E",
};
const hueOf = (key: string) => HUE[key] ?? "#8E5378";

const PHASE_RECS: Record<CyclePhase, { body: string; work: string; tip: string }> = {
  menstrual: { body: "Energy is low; cramps and fatigue are common.", work: "Keep the load light — admin and planning over big pushes.", tip: "Iron-rich meals, warmth and earlier nights." },
  follicular: { body: "Energy, mood and focus are climbing.", work: "Start new projects and tackle the hard problems.", tip: "A good week for a new class or a harder workout." },
  ovulatory: { body: "Energy, confidence and libido peak.", work: "Book the big conversations and presentations.", tip: "Stay hydrated; strength work feels great now." },
  luteal: { body: "Energy dips; bloating, cravings and mood shifts build.", work: "Wrap up and tidy — protect focus from overload.", tip: "Magnesium-rich foods and gentle movement help." },
};

export default function Hormones() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const today = new Date();
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const todayCd = fh.cycleLog?.lastPeriod ? cycleDayFromLog(fh.cycleLog.lastPeriod, L, today) : Math.round(L / 2);
  const [dayState, setDayState] = useState<number | null>(null);
  const day = dayState ?? todayCd;
  const duration = fh.cycleLog?.duration ?? 5;
  const phase = phaseForCycleDay(day, L, duration);
  const carePlan = personaTrack(persona) !== "none";
  const isToday = fh.cycleLog?.lastPeriod != null && day === todayCd;
  const [sel, setSel] = useState<string | null>(null);
  const ovCd = ovulationDay(L);

  const model = hormoneModel(L);
  const val = (key: HormoneKey, d: number) => model.value(key, d);
  const x = (d: number) => PAD + ((d - 1) / (L - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - v * (H - 2 * PAD);

  const pointsFor = (key: HormoneKey): [number, number][] =>
    Array.from({ length: L }, (_, i) => [x(i + 1), y(val(key, i + 1))]);
  const smoothPath = (pts: [number, number][]) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? pts[i + 1];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };
  const areaPath = (line: string, pts: [number, number][]) =>
    `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${(H - PAD).toFixed(1)} L ${pts[0][0].toFixed(1)} ${(H - PAD).toFixed(1)} Z`;
  const paths = HORMONES.map((h) => {
    const pts = pointsFor(h.key);
    const line = smoothPath(pts);
    return { ...h, line, area: areaPath(line, pts) };
  });

  const dominant = [...HORMONES].sort((a, b) => val(b.key, day) - val(a.key, day))[0];
  const dv = val(dominant.key, day);
  const slope = val(dominant.key, Math.min(L, day + 1)) - val(dominant.key, Math.max(1, day - 1));
  const verb = slope > 0.035 ? "rising" : slope < -0.035 ? "easing" : dv > 0.6 ? "peaking" : "steady";
  const activeKey = sel ?? dominant.key;
  const markerX = x(day);
  const curveOpacity = (key: string) => (sel ? (key === sel ? 1 : 0.12) : key === dominant.key ? 1 : 0.5);

  // Phase-map gradient for the scrubber track (hard segment stops).
  const b1 = Math.max(0, Math.min(1, duration / L));
  const b2 = Math.max(b1, Math.min(1, (ovCd - 2) / L));
  const b3 = Math.max(b2, Math.min(1, (ovCd + 2) / L));
  const trackColors = [ATMOSPHERE.menstrual, ATMOSPHERE.menstrual, ATMOSPHERE.follicular, ATMOSPHERE.follicular, ATMOSPHERE.ovulatory, ATMOSPHERE.ovulatory, ATMOSPHERE.luteal, ATMOSPHERE.luteal] as const;
  const trackLocations = [0, b1, b1, b2, b2, b3, b3, 1];

  return (
    <Screen>
      <Header title="For Her · Hormones" />

      <View style={styles.hero}>
        <Text style={styles.h1}>Your hormone <Text style={styles.h1em}>rhythm</Text></Text>
        <Text style={styles.sub}>Day {day}{isToday ? " · today" : ""} · {PHASE_LABEL[phase]} phase</Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={[styles.dominant, { color: hueOf(dominant.key) }]}>{dominant.label} {verb}</Text>

        <View style={styles.chartWrap}>
          <View style={[styles.atmosphere, { backgroundColor: ATMOSPHERE[phase] }]} />
          <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={130} preserveAspectRatio="none">
            <Defs>
              {paths.map((h) => (
                <SvgGradient key={h.key} id={`grad-${h.key}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={hueOf(h.key)} stopOpacity={0.26} />
                  <Stop offset="1" stopColor={hueOf(h.key)} stopOpacity={0} />
                </SvgGradient>
              ))}
            </Defs>
            <Line x1={x(ovCd)} y1={PAD} x2={x(ovCd)} y2={H - PAD} stroke="rgba(91,42,74,0.13)" strokeWidth={1} strokeDasharray={[2, 3]} />
            {paths.map((h) => (
              <Path key={`a-${h.key}`} d={h.area} fill={`url(#grad-${h.key})`} opacity={curveOpacity(h.key)} />
            ))}
            {paths.map((h) => (
              <Path key={`c-${h.key}`} d={h.line} fill="none" stroke={hueOf(h.key)}
                strokeWidth={h.key === "estrogen" ? 2.9 : 2.2} strokeLinejoin="round" strokeLinecap="round" opacity={curveOpacity(h.key)} />
            ))}
            <Line x1={markerX} y1={PAD} x2={markerX} y2={H - PAD} stroke="rgba(91,42,74,0.22)" strokeWidth={1.5} strokeDasharray={[3, 3]} />
            {HORMONES.map((h) => (
              <Circle key={`d-${h.key}`} cx={markerX} cy={y(val(h.key, day))} r={h.key === activeKey ? 5 : 3.4}
                fill={hueOf(h.key)} stroke="#fff" strokeWidth={1.5} opacity={sel ? (h.key === sel ? 1 : 0.15) : 1} />
            ))}
          </Svg>
        </View>

        <View style={styles.axis}>
          <Text style={styles.axisLabel}>Day 1</Text>
          <Text style={[styles.axisLabel, styles.axisOv, { left: `${((ovCd - 1) / (L - 1)) * 100}%` }]}>Ovulation</Text>
          <Text style={styles.axisLabel}>Day {L}</Text>
        </View>

        {/* Scrubber: phase-map track + draggable thumb */}
        <Scrubber value={day} max={L} onChange={setDayState} colors={trackColors} locations={trackLocations} thumb={hueOf(dominant.key)} />
        <Text style={styles.scrubHint}>Drag to explore any day in your cycle</Text>

        <View style={styles.legend}>
          {HORMONES.map((h) => {
            const on = sel === h.key;
            const dim = sel && sel !== h.key;
            return (
              <Pressable key={h.key} onPress={() => setSel(on ? null : h.key)} style={[styles.legItem, on && styles.legOn, dim && styles.legDim]}>
                <View style={[styles.legDot, { backgroundColor: hueOf(h.key) }]} />
                <Text style={styles.legLabel}>{h.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.phaseBox}>
        <Text style={styles.phaseTag}>{PHASE_LABEL[phase]} phase{isToday ? ", right now" : ""}</Text>
        <Text style={styles.phaseProse}>{PHASE_PROSE[phase]}</Text>
      </View>

      <View style={styles.recs}>
        {(["body", "work", "tip"] as const).map((k) => (
          <View key={k} style={styles.recRow}>
            <Text style={styles.recLabel}>{k === "body" ? "Your body" : k === "work" ? "At work" : "Try this"}</Text>
            <Text style={styles.recText}>{PHASE_RECS[phase][k]}</Text>
          </View>
        ))}
      </View>

      <View style={styles.hList}>
        {HORMONES.map((h) => {
          const v = Math.round(val(h.key, day) * 100);
          return (
            <View key={h.key} style={styles.hRow}>
              <View style={styles.hLabelWrap}>
                <View style={[styles.hDot, { backgroundColor: hueOf(h.key) }]} />
                <Text style={styles.hLabel}>{h.label}</Text>
              </View>
              <View style={styles.hBar}>
                <View style={[styles.hBarFill, { width: `${v}%`, backgroundColor: hueOf(h.key) }]} />
              </View>
              <Text style={styles.hVal}>{v}</Text>
            </View>
          );
        })}
      </View>

      {carePlan && (
        <View style={styles.pmosNote}>
          <Text style={styles.pmosText}>
            <Text style={styles.pmosStrong}>With PMOS,</Text> testosterone tends to run higher across the whole cycle — one reason skin, hair and cravings can flare. Steady blood sugar and movement help keep it in check.
          </Text>
        </View>
      )}

      <Text style={styles.disclaimer}>An educational model of how hormones move — not your measured levels.</Text>
    </Screen>
  );
}

function Scrubber({ value, max, onChange, colors: cols, locations, thumb }: {
  value: number; max: number; onChange: (d: number) => void;
  colors: readonly string[]; locations: number[]; thumb: string;
}) {
  const [w, setW] = useState(0);
  const update = (x: number) => {
    if (w <= 0) return;
    const frac = Math.max(0, Math.min(1, x / w));
    onChange(Math.round(1 + frac * (max - 1)));
  };
  const left = w > 0 ? ((value - 1) / (max - 1)) * w : 0;
  return (
    <View style={styles.trackWrap}>
      <View
        style={styles.trackHit}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => update(e.nativeEvent.locationX)}
        onResponderMove={(e) => update(e.nativeEvent.locationX)}
      >
        <LinearGradient colors={cols as unknown as [string, string, ...string[]]} locations={locations as unknown as [number, number, ...number[]]}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.trackBar} />
        <View pointerEvents="none" style={[styles.thumb, { left: left - 11, borderColor: "#fff", backgroundColor: thumb }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 12 },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep },
  h1em: { fontFamily: fonts.serif, fontStyle: "italic", color: colors.plumBright },
  sub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 6 },

  chartCard: { marginHorizontal: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 14 },
  dominant: { textAlign: "center", fontSize: 13, fontFamily: fonts.sansBold, marginBottom: 6 },
  chartWrap: { position: "relative" },
  atmosphere: { position: "absolute", left: -6, right: -6, top: -6, bottom: -6, borderRadius: 18, opacity: 0.10 },
  axis: { position: "relative", flexDirection: "row", justifyContent: "space-between", marginTop: 4, height: 14 },
  axisLabel: { fontSize: 9.5, fontFamily: fonts.sans, color: colors.textMuted },
  axisOv: { position: "absolute", transform: [{ translateX: -20 }] },
  scrubHint: { fontSize: 10, fontFamily: fonts.sans, color: colors.textMuted, textAlign: "center", marginTop: 6 },

  trackWrap: { marginTop: 12, height: 24, justifyContent: "center" },
  trackHit: { height: 24, justifyContent: "center" },
  trackBar: { height: 8, borderRadius: 999 },
  thumb: { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, top: 2 },

  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 12 },
  legItem: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "transparent", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 },
  legOn: { backgroundColor: "rgba(142,83,120,0.1)", borderColor: "rgba(142,83,120,0.3)" },
  legDim: { opacity: 0.45 },
  legDot: { width: 9, height: 9, borderRadius: 5 },
  legLabel: { fontSize: 10.5, fontFamily: fonts.sansMedium, color: colors.textSoft },

  phaseBox: { marginHorizontal: 18, marginTop: 14, backgroundColor: "rgba(142,83,120,0.07)", borderWidth: 1, borderColor: "rgba(142,83,120,0.18)", borderRadius: 15, padding: 13 },
  phaseTag: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright },
  phaseProse: { fontSize: 12.5, fontFamily: fonts.sans, color: "#4A3A44", marginTop: 6, lineHeight: 19 },

  recs: { marginHorizontal: 18, marginTop: 14, gap: 9 },
  recRow: { flexDirection: "row", gap: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 11 },
  recLabel: { width: 62, fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.plumBright },
  recText: { flex: 1, fontSize: 12.5, fontFamily: fonts.sans, color: colors.plumDeep, lineHeight: 17 },

  hList: { marginHorizontal: 18, marginTop: 16, gap: 10 },
  hRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  hLabelWrap: { width: 96, flexDirection: "row", alignItems: "center", gap: 6 },
  hDot: { width: 9, height: 9, borderRadius: 5 },
  hLabel: { fontSize: 12, fontFamily: fonts.sansMedium, color: colors.plumDeep },
  hBar: { flex: 1, height: 7, borderRadius: 999, backgroundColor: "rgba(91,42,74,0.08)", overflow: "hidden" },
  hBarFill: { height: 7, borderRadius: 999 },
  hVal: { width: 24, fontSize: 11, fontFamily: fonts.sansBold, color: colors.textSoft, textAlign: "right" },

  pmosNote: { marginHorizontal: 18, marginTop: 16, backgroundColor: "rgba(47,122,122,0.07)", borderWidth: 1, borderColor: "rgba(47,122,122,0.2)", borderRadius: 15, padding: 13 },
  pmosText: { fontSize: 12, fontFamily: fonts.sans, color: "#4A3A44", lineHeight: 18 },
  pmosStrong: { fontFamily: fonts.sansBold, color: "#236B6B" },

  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginHorizontal: 20, marginTop: 16 },
});
