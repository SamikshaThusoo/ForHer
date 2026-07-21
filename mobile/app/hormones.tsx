import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Line, Circle, Defs, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { Avatar } from "@/components/ui/Avatar";
import { Slider } from "@/components/ui/Slider";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import {
  cycleLengthFor, cycleDayFromLog, phaseForCycleDay, ovulationDay, hormoneModel,
  PHASE_LABEL, HORMONES, type HormoneKey,
} from "@/lib/forher/cycleview";
import { colors, fonts, gradients } from "@/theme/tokens";
import type { CyclePhase } from "@/types/journey";

const W = 320, H = 104, PAD = 6;

const ATMOSPHERE: Record<CyclePhase, string> = {
  menstrual: "#C76B7A", follicular: "#C9A24A", ovulatory: "#2F7A7A", luteal: "#8E5378",
};
const HUE: Record<string, string> = {
  estrogen: "#C76B7A", progesterone: "#8E5378", lh: "#D98324", testosterone: "#2E6E8E",
};
const hueOf = (key: string) => HUE[key] ?? "#8E5378";

// One merged line per phase — what's happening + what to do with it.
const PHASE_SUMMARY: Record<CyclePhase, string> = {
  menstrual: "Energy is low; cramps and fatigue are common. Keep the load light — iron-rich meals, warmth and earlier nights.",
  follicular: "Energy, mood and focus are climbing. A good week for new projects, a new class or a harder workout.",
  ovulatory: "Energy, confidence and libido peak. Book the big conversations — and strength work feels great now.",
  luteal: "Energy dips; bloating, cravings and mood shifts build. Wrap up and tidy — magnesium-rich foods and gentle movement help.",
};

export default function Hormones() {
  const router = useRouter();
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
  // null = focus follows the dominant hormone; "all" = every curve fully lit.
  const [sel, setSel] = useState<HormoneKey | "all" | null>(null);
  const ovCd = ovulationDay(L);

  const lp = fh.cycleLog?.lastPeriod;
  const fmtD = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  let datesLine: string | null = null;
  if (lp) {
    const daysToOv = ((ovCd - todayCd) % L + L) % L;
    const daysToPeriod = todayCd === 1 ? 0 : L - todayCd + 1;
    datesLine = `Next period ~ ${fmtD(new Date(today.getTime() + daysToPeriod * 86400000))} · Ovulation ~ ${fmtD(new Date(today.getTime() + daysToOv * 86400000))}`;
  }

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
  const markerX = x(day);
  // "all" lights every curve fully; otherwise one focused curve, the rest ghosted.
  const focusKey = sel === "all" ? null : sel ?? dominant.key;
  const curveOpacity = (key: string) => (focusKey ? (key === focusKey ? 1 : 0.16) : 1);

  // Phase-map gradient for the scrubber track (hard segment stops).
  const b1 = Math.max(0, Math.min(1, duration / L));
  const b2 = Math.max(b1, Math.min(1, (ovCd - 2) / L));
  const b3 = Math.max(b2, Math.min(1, (ovCd + 2) / L));
  const trackColors = [ATMOSPHERE.menstrual, ATMOSPHERE.menstrual, ATMOSPHERE.follicular, ATMOSPHERE.follicular, ATMOSPHERE.ovulatory, ATMOSPHERE.ovulatory, ATMOSPHERE.luteal, ATMOSPHERE.luteal] as const;
  const trackLocations = [0, b1, b1, b2, b2, b3, b3, 1];

  const phaseWord = PHASE_LABEL[phase].toLowerCase();

  return (
    <Screen>
      <Header title="For Her · Hormones" />

      <View style={styles.hero}>
        <Text style={styles.h1}>Your hormone <Text style={styles.h1em}>rhythm</Text></Text>
      </View>

      {/* ── Today (or scrubbed day) at a glance ── */}
      <View style={styles.todayCard}>
        <Text style={styles.todayTag}>{isToday ? "Today · " : ""}Day {day} · {PHASE_LABEL[phase]} phase</Text>
        <View style={styles.headlineRow}>
          <View style={[styles.headlineDot, { backgroundColor: hueOf(dominant.key) }]} />
          <Text style={[styles.headline, { color: hueOf(dominant.key) }]}>{dominant.label} {verb}</Text>
        </View>
        <Text style={styles.summary}>{PHASE_SUMMARY[phase]}</Text>
        {datesLine && <Text style={styles.dates}>{datesLine}</Text>}
        {carePlan && (
          <Text style={styles.pmosText}>
            <Text style={styles.pmosStrong}>With PMOS,</Text> testosterone tends to run higher across the whole cycle — one reason skin, hair and cravings can flare. Steady blood sugar and movement help keep it in check.
          </Text>
        )}
      </View>

      {/* ── Explore: chart + scrubber, feeds the card above ── */}
      <Text style={styles.sectionLabel}>Explore your cycle</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartWrap}>
          <View style={[styles.atmosphere, { backgroundColor: ATMOSPHERE[phase] }]} />
          <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={116} preserveAspectRatio="none">
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
                strokeWidth={h.key === focusKey ? 2.9 : 2.2} strokeLinejoin="round" strokeLinecap="round" opacity={curveOpacity(h.key)} />
            ))}
            <Line x1={markerX} y1={PAD} x2={markerX} y2={H - PAD} stroke="rgba(91,42,74,0.22)" strokeWidth={1.5} strokeDasharray={[3, 3]} />
            {HORMONES.map((h) => (
              <Circle key={`d-${h.key}`} cx={markerX} cy={y(val(h.key, day))} r={h.key === (focusKey ?? dominant.key) ? 5 : 3.4}
                fill={hueOf(h.key)} stroke="#fff" strokeWidth={1.5} opacity={curveOpacity(h.key)} />
            ))}
          </Svg>
        </View>

        <View style={styles.axis}>
          <Text style={styles.axisLabel}>Day 1</Text>
          <Text style={[styles.axisLabel, styles.axisOv, { left: `${((ovCd - 1) / (L - 1)) * 100}%` }]}>Ovulation</Text>
          <Text style={styles.axisLabel}>Day {L}</Text>
        </View>

        {/* Scrubber: phase-map gradient track + draggable thumb */}
        <View style={styles.trackWrap}>
          <Slider value={day} max={L} onChange={setDayState} thumbColor={hueOf(dominant.key)}
            track={<LinearGradient colors={trackColors as unknown as [string, string, ...string[]]} locations={trackLocations as unknown as [number, number, ...number[]]}
              start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.trackBar} />} />
        </View>
        <Text style={styles.scrubHint}>Drag to see any day — the card above updates</Text>

        <View style={styles.legend}>
          {([{ key: "all" as const, label: "All" }, ...HORMONES]).map((h) => {
            const on = h.key === "all" ? sel === "all" : (focusKey ?? dominant.key) === h.key && sel !== "all";
            return (
              <PressableScale key={h.key} onPress={() => setSel(sel === h.key ? null : h.key)} style={[styles.legItem, on && styles.legOn]}>
                {h.key !== "all" && <View style={[styles.legDot, { backgroundColor: hueOf(h.key) }]} />}
                <Text style={[styles.legLabel, on && styles.legLabelOn]}>{h.label}</Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

      {/* ── Redirect: your phase circle in the community ── */}
      <PressableScale onPress={() => router.push("/community")} style={styles.commCard}>
        <View style={styles.commAvatars}>
          {[0, 1, 2].map((i) => (
            <Avatar key={i} seed={`fh-pace-${phase}-${i}`} size={30} style={[styles.commAv, i > 0 && { marginLeft: -9 }]} />
          ))}
        </View>
        <View style={styles.commBody}>
          <Text style={styles.commTitle}>Women in your {phaseWord} phase</Text>
          <Text style={styles.commSub}>See what they're sharing today — and add your own check-in.</Text>
        </View>
        <ArrowRight size={16} color={colors.plumBright} />
      </PressableScale>

      <Text style={styles.disclaimer}>An educational model of how hormones move — not your measured levels.</Text>

      <PressableScale onPress={() => router.replace("/")} style={styles.doneWrap}>
        <LinearGradient colors={gradients.plum} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.done}>
          <Text style={styles.doneText}>Done</Text>
          <ArrowRight size={16} color="#fff" />
        </LinearGradient>
      </PressableScale>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep },
  h1em: { fontFamily: fonts.serif, fontStyle: "italic", color: colors.plumBright },

  todayCard: { marginHorizontal: 18, backgroundColor: "rgba(142,83,120,0.07)", borderWidth: 1, borderColor: "rgba(142,83,120,0.18)", borderRadius: 16, padding: 14 },
  todayTag: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright },
  headlineRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 },
  headlineDot: { width: 10, height: 10, borderRadius: 5 },
  headline: { fontSize: 15.5, fontFamily: fonts.sansBold },
  summary: { fontSize: 13, fontFamily: fonts.sans, color: "#4A3A44", lineHeight: 19.5, marginTop: 6 },
  dates: { fontSize: 11.5, fontFamily: fonts.sansBold, color: "#C9772A", marginTop: 9 },
  pmosText: { fontSize: 11.5, fontFamily: fonts.sans, color: "#4A3A44", lineHeight: 17, marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: "rgba(142,83,120,0.2)", borderStyle: "dashed" },
  pmosStrong: { fontFamily: fonts.sansBold, color: "#236B6B" },

  sectionLabel: { fontSize: 10.5, fontFamily: fonts.sansBold, letterSpacing: 0.6, textTransform: "uppercase", color: colors.textMuted, marginHorizontal: 22, marginTop: 16, marginBottom: 8 },
  chartCard: { marginHorizontal: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 14 },
  chartWrap: { position: "relative" },
  atmosphere: { position: "absolute", left: -6, right: -6, top: -6, bottom: -6, borderRadius: 18, opacity: 0.10 },
  axis: { position: "relative", flexDirection: "row", justifyContent: "space-between", marginTop: 4, height: 14 },
  axisLabel: { fontSize: 9.5, fontFamily: fonts.sans, color: colors.textMuted },
  axisOv: { position: "absolute", transform: [{ translateX: -20 }] },
  scrubHint: { fontSize: 10, fontFamily: fonts.sans, color: colors.textMuted, textAlign: "center", marginTop: 6 },

  trackWrap: { marginTop: 12, height: 24, justifyContent: "center" },
  trackBar: { height: 8, borderRadius: 999 },

  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 12 },
  legItem: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: "rgba(91,42,74,0.14)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  legOn: { backgroundColor: "rgba(142,83,120,0.1)", borderColor: "rgba(142,83,120,0.4)" },
  legDot: { width: 8, height: 8, borderRadius: 4 },
  legLabel: { fontSize: 10.5, fontFamily: fonts.sansMedium, color: colors.textSoft },
  legLabelOn: { fontFamily: fonts.sansBold, color: colors.plumDeep },

  commCard: { flexDirection: "row", alignItems: "center", gap: 11, marginHorizontal: 18, marginTop: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 13 },
  commAvatars: { flexDirection: "row", alignItems: "center" },
  commAv: { borderWidth: 2, borderColor: "#fff" },
  commBody: { flex: 1 },
  commTitle: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.plumDeep },
  commSub: { fontSize: 11.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 16 },

  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginHorizontal: 20, marginTop: 14 },
  doneWrap: { marginHorizontal: 18, marginTop: 14, marginBottom: 6, borderRadius: 14, overflow: "hidden" },
  done: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 14 },
  doneText: { color: "#fff", fontSize: 14.5, fontFamily: fonts.sansBold },
});
