import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Path, G } from "react-native-svg";
import { phaseForCycleDay, ovulationDay, PHASE_COLOR, PHASE_LABEL } from "@/lib/forher/cycleview";
import type { CyclePhase } from "@/types/journey";
import { fonts } from "@/theme/tokens";

const VB = 300, C = 150, R = 116, TRACK = 13, ACTIVE = 19, GAP_DEG = 3, TAU = Math.PI / 180;
const FLOR = "#4F9D69";

const polar = (r: number, deg: number) => ({ x: C + r * Math.cos(deg * TAU), y: C + r * Math.sin(deg * TAU) });

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

function Flower({ cx, cy, size, color }: { cx: number; cy: number; size: number; color: string }) {
  const petals = [0, 72, 144, 216, 288];
  const pr = size * 0.3, off = size * 0.34;
  return (
    <G>
      {petals.map((a) => {
        const rad = (a - 90) * TAU;
        return <Circle key={a} cx={cx + off * Math.cos(rad)} cy={cy + off * Math.sin(rad)} r={pr} fill={color} />;
      })}
      <Circle cx={cx} cy={cy} r={pr * 0.85} fill="#F2C14E" />
    </G>
  );
}

/** The cycle ring — a 4-phase arc ring with the florette at ovulation, period drops
 *  on the menstrual arc, and a marker at the selected day. Pure visual; reads the model. */
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
  const drops = Array.from({ length: Math.min(duration, 7) }, (_, i) => polar(R, dayToAngle(i + 1) + 180 / L));
  const markerColor = PHASE_COLOR[phase];
  const isOv = cycleDay === ovCd;

  return (
    <View style={styles.wrap}>
      <Svg viewBox={`0 0 ${VB} ${VB}`} width={260} height={260}>
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
        {drops.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={2.8} fill="#fff" opacity={0.9} />)}
        <Flower cx={ovPos.x} cy={ovPos.y} size={13} color={FLOR} />
        {isOv
          ? <Flower cx={marker.x} cy={marker.y} size={16} color={FLOR} />
          : <Circle cx={marker.x} cy={marker.y} r={9} fill={markerColor} stroke="#fff" strokeWidth={3} />}
      </Svg>

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
  wrap: { width: 260, height: 260, alignSelf: "center", justifyContent: "center", alignItems: "center" },
  center: { position: "absolute", width: 260, height: 260, alignItems: "center", justifyContent: "center" },
  bigDay: { fontSize: 44, fontFamily: fonts.serif, color: "#3E1B33", lineHeight: 48 },
  ofL: { fontSize: 12, fontFamily: fonts.sans, color: "#9A8A92", marginTop: -2 },
  pill: { marginTop: 8, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 11 },
  pillText: { fontSize: 12, fontFamily: fonts.sansBold },
  status: { fontSize: 11, fontFamily: fonts.sansMedium, color: "#6B5A65", marginTop: 8, textAlign: "center", maxWidth: 160 },
});
