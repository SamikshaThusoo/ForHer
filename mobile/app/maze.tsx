import { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import Svg, { Path, Circle, G, Text as SvgText, Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan } from "@/lib/journey";
import { Header } from "@/components/ui/Header";
import { colors, fonts } from "@/theme/tokens";
import {
  CW, CH, EDGES, SOLUTION, CHECKPOINTS_GEO, BRANCHES, LANDMARKS, START_PT, GOAL_PT,
} from "@/lib/maze/geo";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Path helpers over the maze solution polyline ───────────────────────────

type Pt = { x: number; y: number };

const SEG_LENS = SOLUTION.slice(1).map((b, i) => {
  const a = SOLUTION[i];
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
});
const TOTAL_LEN = SEG_LENS.reduce((s, l) => s + l, 0);

function posForDay(day: number): Pt {
  const target = (Math.min(Math.max(day, 0), 90) / 90) * TOTAL_LEN;
  let dist = 0;
  for (let i = 0; i < SEG_LENS.length; i++) {
    const end = dist + SEG_LENS[i];
    if (target <= end || i === SEG_LENS.length - 1) {
      const t = SEG_LENS[i] > 0 ? (target - dist) / SEG_LENS[i] : 0;
      return {
        x: SOLUTION[i][0] + (SOLUTION[i + 1][0] - SOLUTION[i][0]) * t,
        y: SOLUTION[i][1] + (SOLUTION[i + 1][1] - SOLUTION[i][1]) * t,
      };
    }
    dist = end;
  }
  return { x: SOLUTION[SOLUTION.length - 1][0], y: SOLUTION[SOLUTION.length - 1][1] };
}

function solutionSliceD(fromDay: number, toDay: number): string {
  const a = (Math.min(Math.max(fromDay, 0), 90) / 90) * TOTAL_LEN;
  const b = (Math.min(Math.max(toDay, 0), 90) / 90) * TOTAL_LEN;
  const pts: string[] = [];
  let dist = 0;
  const startP = posForDay(fromDay);
  pts.push(`M ${startP.x} ${startP.y}`);
  for (let i = 0; i < SEG_LENS.length; i++) {
    const end = dist + SEG_LENS[i];
    if (end > a && dist < b) {
      if (end >= b) {
        const endP = posForDay(toDay);
        pts.push(`L ${endP.x} ${endP.y}`);
        break;
      }
      pts.push(`L ${SOLUTION[i + 1][0]} ${SOLUTION[i + 1][1]}`);
    }
    dist = end;
  }
  return pts.join(" ");
}

// All maze corridors as one multi-subpath D string
const EDGES_D = EDGES.map(([x1, y1, x2, y2]) => `M ${x1} ${y1} L ${x2} ${y2}`).join(" ");

// ─── Scoring ─────────────────────────────────────────────────────────────────

type Score = "good" | "warn" | "miss" | "future";

function scoreWindow(done: Record<number, string[]>, from: number, to: number, persona: Parameters<typeof resolveDailyPlan>[0]): Score {
  let total = 0, completed = 0;
  for (let d = from; d <= to; d++) {
    const plan = resolveDailyPlan(persona, d);
    total += plan.length;
    completed += (done[d] ?? []).length;
  }
  if (total === 0) return "future";
  const rate = completed / total;
  if (rate >= 0.5) return "good";
  if (rate >= 0.25) return "warn";
  return "miss";
}

const NODE_STROKE: Record<Score, string> = {
  good: "#2E7A50",
  warn: "#A07830",
  miss: "#A04020",
  future: "rgba(142,83,120,0.4)",
};

// ─── Minimap ─────────────────────────────────────────────────────────────────

const MM_SCALE = 0.085;
const MM_W = Math.round(CW * MM_SCALE) + 8;
const MM_H = Math.round(CH * MM_SCALE) + 8;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MazeScreen() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const day = Math.min(fh.day, 90);

  const scores = useMemo(() =>
    CHECKPOINTS_GEO.map((cp, i) => {
      const from = i === 0 ? 1 : CHECKPOINTS_GEO[i - 1].day + 1;
      return scoreWindow(fh.done, from, cp.day, persona);
    }),
    [fh.done, persona],
  );

  const userPos = posForDay(day);
  const fullRouteD = solutionSliceD(0, 90);
  const donePathD = solutionSliceD(0, day);
  const aheadPathD = solutionSliceD(day, 90);

  // Center the camera on the user's current position initially
  const initX = Math.min(0, Math.max(-(CW - SW), -(userPos.x - SW / 2)));
  const initY = Math.min(0, Math.max(-(CH - SH + 120), -(userPos.y - SH / 2)));

  const tx = useSharedValue(initX);
  const ty = useSharedValue(initY);
  const baseX = useSharedValue(initX);
  const baseY = useSharedValue(initY);

  const pan = Gesture.Pan()
    .onBegin(() => { baseX.value = tx.value; baseY.value = ty.value; })
    .onUpdate((e) => {
      tx.value = Math.min(0, Math.max(-(CW - SW), baseX.value + e.translationX));
      ty.value = Math.min(0, Math.max(-(CH - SH + 120), baseY.value + e.translationY));
    });

  const canvasStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  const mmVpStyle = useAnimatedStyle(() => ({
    left: 4 + (-tx.value / CW) * (MM_W - 8),
    top: 4 + (-ty.value / CH) * (MM_H - 8),
    width: (SW / CW) * (MM_W - 8),
    height: ((SH - 120) / CH) * (MM_H - 8),
  }));

  return (
    <View style={styles.root}>
      <Header title="Journey Maze" />

      <View style={styles.hint}>
        <Text style={styles.hintText}>Pan to explore · follow the pale road & golden beads · Day {day} of 90</Text>
      </View>

      <GestureDetector gesture={pan}>
        <View style={styles.viewport}>
          <Animated.View style={[{ width: CW, height: CH }, canvasStyle]}>
            <Svg width={CW} height={CH}>
              <Defs>
                <LinearGradient id="mazeBg" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#5A2A4B" />
                  <Stop offset="1" stopColor="#2E1024" />
                </LinearGradient>
              </Defs>

              {/* ── Hedge background ── */}
              <Rect x={0} y={0} width={CW} height={CH} fill="#451D38" />
              <Rect x={0} y={0} width={CW} height={CH} fill="url(#mazeBg)" opacity={0.5} />

              {/* ── Corridors: dark walls, dim floors — decoys recede ── */}
              <Path d={EDGES_D} stroke="#2A0E21" strokeWidth={38} fill="none" strokeLinecap="round" />
              <Path d={EDGES_D} stroke="#5C2B4B" strokeWidth={28} fill="none" strokeLinecap="round" />

              {/* ── The 90-day route, paved light so it reads as the road ── */}
              <Path d={fullRouteD} stroke="#F6EBF2" strokeWidth={20} fill="none"
                strokeLinecap="round" strokeLinejoin="round" />

              {/* ── Decoy branches at off-track checkpoints ── */}
              {BRANCHES.map((br, i) => {
                if (!br) return null;
                const cp = CHECKPOINTS_GEO[i];
                const offTrack = day >= cp.day && (scores[i] === "miss" || scores[i] === "warn");
                if (!offTrack) return null;
                const d = br.map((p, j) => `${j === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
                const end = br[br.length - 1];
                return (
                  <G key={`br-${cp.day}`}>
                    <Path d={d} stroke="rgba(201,98,42,0.55)" strokeWidth={20} fill="none"
                      strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx={end[0]} cy={end[1]} r={9} fill="#C9622A" />
                    <SvgText x={end[0]} y={end[1] + 4} fontSize={11} fontFamily="DMSans_700Bold"
                      textAnchor="middle" fill="#fff">✕</SvgText>
                  </G>
                );
              })}

              {/* ── Breadcrumb beads: the route still ahead ── */}
              <Path d={aheadPathD} stroke="#C4903A" strokeWidth={5.5} fill="none"
                strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.1 15" />

              {/* ── Walked route: soft glow + solid stroke on the pale road ── */}
              {day > 0 && (
                <>
                  <Path d={donePathD} stroke={colors.plumBright} strokeWidth={22} fill="none"
                    strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
                  <Path d={donePathD} stroke={colors.plum} strokeWidth={13} fill="none"
                    strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}

              {/* ── Checkpoint medallions: white disc + status ring, always readable ── */}
              {CHECKPOINTS_GEO.map((cp, i) => {
                const score = scores[i];
                const passed = day >= cp.day;
                return (
                  <G key={`cp-${cp.day}`}>
                    <Circle cx={cp.x} cy={cp.y} r={16} fill="#fff"
                      stroke={passed ? NODE_STROKE[score] : "rgba(255,255,255,0.45)"}
                      strokeWidth={passed ? 4 : 2.5} />
                    <SvgText x={cp.x} y={cp.y + 3.5} fontSize={10} fontFamily="DMSans_700Bold"
                      textAnchor="middle"
                      fill={passed ? NODE_STROKE[score] : "#8E5378"}>
                      {`D${cp.day}`}
                    </SvgText>
                  </G>
                );
              })}

              {/* ── GOAL: gold medallion ── */}
              <Circle cx={GOAL_PT.x} cy={GOAL_PT.y} r={22} fill="#F0C75A" stroke="#B98A2E" strokeWidth={4} />
              <SvgText x={GOAL_PT.x} y={GOAL_PT.y + 6.5} fontSize={19} textAnchor="middle" fill="#6B4A05">★</SvgText>

              {/* ── START ── */}
              <Circle cx={START_PT.x} cy={START_PT.y} r={16} fill="#fff" stroke={colors.plum} strokeWidth={3} />
              <SvgText x={START_PT.x} y={START_PT.y + 3.5} fontSize={8} fontFamily="DMSans_700Bold"
                textAnchor="middle" fill={colors.plum} letterSpacing={0.3}>START</SvgText>

              {/* ── User dot ── */}
              {day > 0 && (
                <G>
                  <Circle cx={userPos.x} cy={userPos.y} r={26}
                    fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.45} />
                  <Circle cx={userPos.x} cy={userPos.y} r={18}
                    fill="#fff" stroke={colors.plum} strokeWidth={4} />
                  <Circle cx={userPos.x} cy={userPos.y} r={8} fill={colors.plum} />
                </G>
              )}
            </Svg>

            {/* ── Landmarks on white discs (emoji render better as RN Text than SvgText) ── */}
            {LANDMARKS.map((lm, i) => (
              <View key={`lm-${i}`} style={[styles.landmark, { left: lm.x - 16, top: lm.y - 16 }]}>
                <Text style={styles.landmarkEmoji}>{lm.emoji}</Text>
              </View>
            ))}

            {/* ── "You" label chip above the user dot ── */}
            {day > 0 && (
              <View style={[styles.youChipWrap, { left: userPos.x - 60, top: userPos.y - 52 }]}>
                <View style={styles.youChip}>
                  <Text style={styles.youChipText}>You · Day {day}</Text>
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* ── Minimap ── */}
      <View style={styles.minimap}>
        <Svg width={MM_W} height={MM_H}>
          <Rect x={0} y={0} width={MM_W} height={MM_H} rx={6} fill="rgba(46,16,36,0.9)" />
          {/* Full route */}
          <Path
            d={SOLUTION.map((p, i) => `${i === 0 ? "M" : "L"} ${4 + p[0] * MM_SCALE} ${4 + p[1] * MM_SCALE}`).join(" ")}
            stroke="rgba(246,235,242,0.5)" strokeWidth={2} fill="none"
          />
          {/* Walked portion */}
          {day > 0 && (
            <Path
              d={donePathD.replace(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g, (_, x, y) =>
                `${4 + parseFloat(x) * MM_SCALE} ${4 + parseFloat(y) * MM_SCALE}`)}
              stroke="#C687AC" strokeWidth={2.5} fill="none"
            />
          )}
          <Circle cx={4 + userPos.x * MM_SCALE} cy={4 + userPos.y * MM_SCALE} r={3} fill="#fff" />
          <Circle cx={4 + GOAL_PT.x * MM_SCALE} cy={4 + GOAL_PT.y * MM_SCALE} r={3} fill="#4F9D69" />
        </Svg>
        <Animated.View style={[styles.mmViewport, mmVpStyle]} />
      </View>

      {/* ── Legend ── */}
      <View style={styles.legend}>
        <LegendDot color="#F6EBF2" label="Your road" />
        <LegendDot color="#C4903A" label="Ahead" />
        <LegendDot color="#4F9D69" label="On track" />
        <LegendDot color="#C9A24A" label="Partial" />
        <LegendDot color="#C76B4A" label="Detour" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#3A162E" },
  hint: { paddingHorizontal: 18, paddingVertical: 8, alignItems: "center" },
  hintText: { fontSize: 11.5, fontFamily: fonts.sansMedium, color: "rgba(255,255,255,0.75)" },

  viewport: { flex: 1, overflow: "hidden" },

  landmark: {
    position: "absolute", width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center",
    shadowColor: "#2E1024", shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  landmarkEmoji: { fontSize: 16 },

  youChipWrap: { position: "absolute", width: 120, alignItems: "center" },
  youChip: {
    backgroundColor: "#fff", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10,
    shadowColor: "#2E1024", shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  youChipText: { fontSize: 10.5, fontFamily: fonts.sansBold, color: colors.plum },

  minimap: {
    position: "absolute", top: 110, right: 14,
    width: MM_W, height: MM_H,
    borderRadius: 8, overflow: "hidden",
    shadowColor: "#3E1B33", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  mmViewport: {
    position: "absolute",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 2,
  },

  legend: { flexDirection: "row", justifyContent: "center", gap: 14, paddingVertical: 10, backgroundColor: "#3A162E", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 10.5, fontFamily: fonts.sansMedium, color: "rgba(255,255,255,0.75)" },
});
