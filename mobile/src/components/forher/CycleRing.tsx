import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { phaseForCycleDay, ovulationDay, PHASE_COLOR, PHASE_LABEL } from "@/lib/forher/cycleview";
import type { CyclePhase } from "@/types/journey";
import { Florette, BloodDrop } from "./CycleArt";
import { fonts } from "@/theme/tokens";

const VB = 300, C = 150, R = 116, TRACK = 13, ACTIVE = 19, GAP_DEG = 3, TAU = Math.PI / 180;
const SIZE = 260, K = SIZE / VB; // px-per-viewbox-unit for overlays
const FLOR = "#4F9D69";

const polar = (r: number, deg: number) => ({ x: C + r * Math.cos(deg * TAU), y: C + r * Math.sin(deg * TAU) });
const px = (v: number) => v * K;

function arcPath(r: number, a0: number, a1: number) {
  const s = polar(r, a0), e = polar(r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function statusLine(day: number, L: number, ovCd: number, duration: number) {
  if (day <= duration) return `Period · day ${day}`;
  if (day === ovCd) return "Ovulation day";
  if (day >= ovCd - 5 && day <= ovCd) return "Fertile window open";
  const toNext = day === 1 ? 0 : L - day + 1;
  return toNext === 0 ? "Period due today" : `Next period in ${toNext} day${toNext === 1 ? "" : "s"}`;
}

/** Absolutely-positioned art overlay at a ring coordinate (viewbox space). */
function Deco({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return <View pointerEvents="none" style={[styles.deco, { left: px(x), top: px(y) }]}>{children}</View>;
}

/** The cycle ring — a 4-phase arc ring with blood drops on the period arc, the
 *  florette at ovulation, and a live marker at the selected day. Reads the model only. */
export function CycleRing({ L, cycleDay, todayCd, duration, onPhaseTap }: {
  L: number; cycleDay: number; todayCd: number; duration: number; onPhaseTap?: (day: number) => void;
}) {
  const ovCd = ovulationDay(L);
  const ovStart = ovCd - 1, ovEnd = ovCd + 2;
  const phase = phaseForCycleDay(cycleDay, L, duration);
  const dayToAngle = (d: number) => -90 + ((d - 1) / L) * 360;

  const segsRaw: { phase: CyclePhase; a: number; b: number }[] = [
    { phase: "menstrual", a: 1, b: duration },
    { phase: "follicular", a: duration + 1, b: ovStart - 1 },
    { phase: "ovulatory", a: Math.max(ovStart, duration + 1), b: ovEnd },
    { phase: "luteal", a: ovEnd + 1, b: L },
  ];
  const segs = segsRaw.filter((s) => s.b >= s.a);

  const marker = polar(R, dayToAngle(cycleDay));
  const ovPos = polar(R, dayToAngle(ovCd));
  const todayPos = polar(R, dayToAngle(todayCd));
  const drops = Array.from({ length: Math.min(duration, 7) }, (_, i) => polar(R, dayToAngle(i + 1) + 180 / L));
  const markerColor = PHASE_COLOR[phase];
  const isOv = cycleDay === ovCd;
  const isToday = cycleDay === todayCd;

  return (
    <View style={styles.wrap}>
      <Svg viewBox={`0 0 ${VB} ${VB}`} width={SIZE} height={SIZE}>
        <Circle cx={C} cy={C} r={R} fill="none" stroke="rgba(91,42,74,0.08)" strokeWidth={TRACK} />
        {segs.map((s) => {
          const active = s.phase === phase;
          const a0 = dayToAngle(s.a) + GAP_DEG, a1 = dayToAngle(s.b + 1) - GAP_DEG;
          return (
            <Path key={s.phase} d={arcPath(R, a0, a1)} fill="none" stroke={PHASE_COLOR[s.phase]}
              strokeWidth={active ? ACTIVE : TRACK} strokeLinecap="round" opacity={active ? 1 : 0.42}
              onPress={onPhaseTap ? () => onPhaseTap(s.a) : undefined} />
          );
        })}
      </Svg>

      {/* period drops along the menstrual arc */}
      {drops.map((p, i) => <Deco key={i} x={p.x} y={p.y}><BloodDrop size={12} /></Deco>)}
      {/* florette at the ovulation point */}
      <Deco x={ovPos.x} y={ovPos.y}><Florette size={22} color={FLOR} bright /></Deco>
      {/* faint today tick when scrubbed away */}
      {!isToday && <View pointerEvents="none" style={[styles.todayTick, { left: px(todayPos.x), top: px(todayPos.y) }]} />}
      {/* live marker — florette on ovulation day, else a phase-coloured dot */}
      <View pointerEvents="none" style={[styles.deco, { left: px(marker.x), top: px(marker.y) }]}>
        {isOv
          ? <Florette size={28} color={FLOR} bright />
          : <View style={[styles.marker, { backgroundColor: markerColor, shadowColor: markerColor }]} />}
      </View>

      <View style={styles.center} pointerEvents="none">
        <Text style={styles.bigDay}>{cycleDay}</Text>
        <Text style={styles.ofL}>of {L} days</Text>
        <View style={[styles.pill, { backgroundColor: `${markerColor}1f` }]}>
          <Text style={[styles.pillText, { color: markerColor }]}>{PHASE_LABEL[phase]}</Text>
        </View>
        <Text style={styles.status}>{statusLine(cycleDay, L, ovCd, duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignSelf: "center", justifyContent: "center", alignItems: "center" },
  center: { position: "absolute", width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  deco: { position: "absolute", transform: [{ translateX: "-50%" }, { translateY: "-50%" }] },
  todayTick: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(91,42,74,0.25)", transform: [{ translateX: "-50%" }, { translateY: "-50%" }] },
  marker: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: "#fff", shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  bigDay: { fontSize: 44, fontFamily: fonts.serif, color: "#3E1B33", lineHeight: 48 },
  ofL: { fontSize: 12, fontFamily: fonts.sans, color: "#9A8A92", marginTop: -2 },
  pill: { marginTop: 8, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 11 },
  pillText: { fontSize: 12, fontFamily: fonts.sansBold },
  status: { fontSize: 11, fontFamily: fonts.sansMedium, color: "#6B5A65", marginTop: 8, textAlign: "center", maxWidth: 160 },
});
