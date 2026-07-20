import { useMemo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import Svg, { Path, Circle, G, Text as SvgText, Rect, Line } from "react-native-svg";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan } from "@/lib/journey";
import { Header } from "@/components/ui/Header";
import { colors, fonts } from "@/theme/tokens";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Maze geometry ──────────────────────────────────────────────────────────

const CW = 560;  // canvas width
const CH = 1340; // canvas height
const X1 = 80;   // left corridor x
const X2 = 460;  // right corridor x

type Pt = { x: number; y: number };

// Serpentine main-path waypoints from bottom (Day 0) to top (Day 90).
// Even-indexed corners are on the right (X2); odd-indexed on the left (X1).
const W: Pt[] = [
  { x: X1,  y: 1240 }, // 0  Start / Day 0
  { x: X2,  y: 1240 }, // 1  Day 10  (right corner)
  { x: X2,  y: 1120 }, // 2  bend
  { x: X1,  y: 1120 }, // 3  Day 20  (left corner)
  { x: X1,  y: 1000 }, // 4  bend
  { x: X2,  y: 1000 }, // 5  Day 30  (right corner)
  { x: X2,  y: 880  }, // 6  bend
  { x: X1,  y: 880  }, // 7  Day 40  (left corner)
  { x: X1,  y: 760  }, // 8  bend
  { x: X2,  y: 760  }, // 9  Day 50  (right corner)
  { x: X2,  y: 640  }, // 10 bend
  { x: X1,  y: 640  }, // 11 Day 60  (left corner)
  { x: X1,  y: 520  }, // 12 bend
  { x: X2,  y: 520  }, // 13 Day 70  (right corner)
  { x: X2,  y: 400  }, // 14 bend
  { x: X1,  y: 400  }, // 15 Day 80  (left corner)
  { x: X1,  y: 280  }, // 16 bend
  { x: X2,  y: 280  }, // 17 Day 90  (right corner)
  { x: X2,  y: 140  }, // 18 GOAL
];

const GOAL: Pt = { x: X2, y: 140 };

const SEG_LENS = W.slice(1).map((b, i) => {
  const a = W[i];
  return Math.hypot(b.x - a.x, b.y - a.y);
});
const TOTAL_LEN = SEG_LENS.reduce((s, l) => s + l, 0);

function posForDay(day: number): Pt {
  const target = (Math.min(Math.max(day, 0), 90) / 90) * TOTAL_LEN;
  let dist = 0;
  for (let i = 0; i < SEG_LENS.length; i++) {
    const end = dist + SEG_LENS[i];
    if (target <= end || i === SEG_LENS.length - 1) {
      const t = SEG_LENS[i] > 0 ? (target - dist) / SEG_LENS[i] : 0;
      return { x: W[i].x + (W[i + 1].x - W[i].x) * t, y: W[i].y + (W[i + 1].y - W[i].y) * t };
    }
    dist = end;
  }
  return W[W.length - 1];
}

function completedD(day: number): string {
  if (day <= 0) return `M ${W[0].x} ${W[0].y}`;
  const target = (Math.min(day, 90) / 90) * TOTAL_LEN;
  let dist = 0;
  const pts = [`M ${W[0].x} ${W[0].y}`];
  for (let i = 0; i < SEG_LENS.length; i++) {
    const end = dist + SEG_LENS[i];
    if (target <= end) {
      const t = SEG_LENS[i] > 0 ? (target - dist) / SEG_LENS[i] : 0;
      pts.push(`L ${W[i].x + (W[i + 1].x - W[i].x) * t} ${W[i].y + (W[i + 1].y - W[i].y) * t}`);
      break;
    }
    pts.push(`L ${W[i + 1].x} ${W[i + 1].y}`);
    dist = end;
  }
  return pts.join(" ");
}

const fullD = W.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

// Checkpoint definitions: waypoint index + which side the wrong-turn stub goes
const CHECKPOINTS: { day: number; wi: number; wrongPt: Pt; hint: string }[] = [
  { day: 10, wi: 1,  wrongPt: { x: X2 + 70, y: 1240 }, hint: "Log 3 meals → back on track" },
  { day: 20, wi: 3,  wrongPt: { x: X1 - 70, y: 1120 }, hint: "Complete 3 tasks → back on track" },
  { day: 30, wi: 5,  wrongPt: { x: X2 + 70, y: 1000 }, hint: "Book your consult → back on track" },
  { day: 40, wi: 7,  wrongPt: { x: X1 - 70, y: 880  }, hint: "Log mood 4 days → back on track" },
  { day: 50, wi: 9,  wrongPt: { x: X2 + 70, y: 760  }, hint: "Hit step goal 3× → back on track" },
  { day: 60, wi: 11, wrongPt: { x: X1 - 70, y: 640  }, hint: "Log your meals → back on track" },
  { day: 70, wi: 13, wrongPt: { x: X2 + 70, y: 520  }, hint: "Reschedule consult → back on track" },
  { day: 80, wi: 15, wrongPt: { x: X1 - 70, y: 400  }, hint: "Log symptoms 3 days → back on track" },
  { day: 90, wi: 17, wrongPt: { x: X2 + 70, y: 280  }, hint: "Finish your final check-in" },
];

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

const NODE_COLOR: Record<Score, string> = {
  good: "#4F9D69",
  warn: "#C9A24A",
  miss: "#C76B4A",
  future: "rgba(142,83,120,0.18)",
};
const NODE_STROKE: Record<Score, string> = {
  good: "#2E7A50",
  warn: "#A07830",
  miss: "#A04020",
  future: "rgba(142,83,120,0.35)",
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
    CHECKPOINTS.map((cp, i) => {
      const from = i === 0 ? 1 : CHECKPOINTS[i - 1].day + 1;
      return scoreWindow(fh.done, from, cp.day, persona);
    }),
    [fh.done, persona],
  );

  const userPos = posForDay(day);
  const donePathD = completedD(day);

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

  // Minimap viewport indicator
  const mmVpStyle = useAnimatedStyle(() => ({
    left: 4 + (-tx.value / CW) * (MM_W - 8),
    top: 4 + (-ty.value / CH) * (MM_H - 8),
    width: (SW / CW) * (MM_W - 8),
    height: ((SH - 120) / CH) * (MM_H - 8),
  }));

  return (
    <View style={styles.root}>
      <Header title="Journey Map" />

      <View style={styles.hint}>
        <Text style={styles.hintText}>Pan to explore · Day {day} of 90</Text>
      </View>

      <GestureDetector gesture={pan}>
        <View style={styles.viewport}>
          <Animated.View style={[{ width: CW, height: CH }, canvasStyle]}>
            <Svg width={CW} height={CH}>

              {/* ── Background ── */}
              <Rect x={0} y={0} width={CW} height={CH} fill="#F8F2F6" />

              {/* ── Grid dots (maze texture) ── */}
              {Array.from({ length: 14 }, (_, col) =>
                Array.from({ length: 28 }, (_, row) => (
                  <Circle
                    key={`${col}-${row}`}
                    cx={40 + col * 40}
                    cy={40 + row * 46}
                    r={1.5}
                    fill="rgba(142,83,120,0.12)"
                  />
                ))
              )}

              {/* ── Wrong-turn stubs (all checkpoints) ── */}
              {CHECKPOINTS.map((cp, i) => {
                const from = W[cp.wi];
                const isOffTrack = scores[i] === "miss" || scores[i] === "warn";
                const isFuture = scores[i] === "future";
                const color = isOffTrack ? "#C9622A" : isFuture ? "rgba(142,83,120,0.15)" : "rgba(79,157,105,0.25)";
                return (
                  <G key={`wt-${cp.day}`}>
                    {/* Outer wall */}
                    <Line x1={from.x} y1={from.y} x2={cp.wrongPt.x} y2={cp.wrongPt.y}
                      stroke={isOffTrack ? "#7A3A1A" : "rgba(100,60,80,0.15)"} strokeWidth={28} strokeLinecap="square" />
                    {/* Floor */}
                    <Line x1={from.x} y1={from.y} x2={cp.wrongPt.x} y2={cp.wrongPt.y}
                      stroke={color} strokeWidth={18} strokeLinecap="square"
                      strokeDasharray={isOffTrack ? undefined : "8 6"} />
                    {/* Dead-end cap */}
                    <Circle cx={cp.wrongPt.x} cy={cp.wrongPt.y} r={10}
                      fill={isOffTrack ? "#C9622A" : "rgba(142,83,120,0.15)"}
                      stroke={isOffTrack ? "#7A3A1A" : "rgba(142,83,120,0.2)"} strokeWidth={2} />
                    {isOffTrack && (
                      <>
                        <Line x1={cp.wrongPt.x - 5} y1={cp.wrongPt.y - 5}
                          x2={cp.wrongPt.x + 5} y2={cp.wrongPt.y + 5}
                          stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
                        <Line x1={cp.wrongPt.x + 5} y1={cp.wrongPt.y - 5}
                          x2={cp.wrongPt.x - 5} y2={cp.wrongPt.y + 5}
                          stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
                        {/* Redemption label */}
                        <SvgText
                          x={cp.wrongPt.x > X1 + 50 ? cp.wrongPt.x - 14 : cp.wrongPt.x + 14}
                          y={from.y + (cp.wrongPt.y > from.y ? 0 : 0) - 6}
                          fontSize={8} fontFamily="DMSans_400Regular"
                          fill="#C9622A" textAnchor={cp.wrongPt.x > X1 + 50 ? "end" : "start"}
                          fontStyle="italic"
                        >
                          {cp.hint}
                        </SvgText>
                      </>
                    )}
                  </G>
                );
              })}

              {/* ── Main path — outer wall (dark, thick) ── */}
              <Path d={fullD} stroke="#3E1B33" strokeWidth={36} fill="none" strokeLinecap="square" strokeLinejoin="miter" />

              {/* ── Main path — floor (upcoming, light) ── */}
              <Path d={fullD} stroke="#EDE0E9" strokeWidth={24} fill="none" strokeLinecap="square" strokeLinejoin="miter" />

              {/* ── Completed path — floor (plum) ── */}
              <Path d={donePathD} stroke={colors.plumBright} strokeWidth={24} fill="none" strokeLinecap="square" strokeLinejoin="miter" />

              {/* ── GOAL ── */}
              <Circle cx={GOAL.x} cy={GOAL.y} r={24} fill="#2E7A50" stroke="#1A5035" strokeWidth={3} />
              <SvgText x={GOAL.x} y={GOAL.y + 5} fontSize={20} textAnchor="middle" fill="#fff">★</SvgText>
              <SvgText x={GOAL.x} y={GOAL.y + 42} fontSize={10} fontFamily="DMSans_700Bold"
                textAnchor="middle" fill="#2E7A50" letterSpacing={0.5}>DAY 90</SvgText>

              {/* ── START ── */}
              <Circle cx={W[0].x} cy={W[0].y} r={14} fill={colors.plumBright} stroke={colors.plum} strokeWidth={2.5} />
              <SvgText x={W[0].x} y={W[0].y + 4} fontSize={8} fontFamily="DMSans_700Bold"
                textAnchor="middle" fill="#fff" letterSpacing={0.3}>START</SvgText>

              {/* ── Checkpoint nodes ── */}
              {CHECKPOINTS.map((cp, i) => {
                const p = W[cp.wi];
                const score = scores[i];
                const passed = day >= cp.day;
                return (
                  <G key={`cp-${cp.day}`}>
                    <Circle cx={p.x} cy={p.y} r={18}
                      fill={passed ? NODE_COLOR[score] : "rgba(142,83,120,0.12)"}
                      stroke={passed ? NODE_STROKE[score] : "rgba(142,83,120,0.25)"}
                      strokeWidth={2.5} />
                    <SvgText x={p.x} y={p.y - 4} fontSize={8} fontFamily="DMSans_700Bold"
                      textAnchor="middle" fill={passed ? "#fff" : "rgba(142,83,120,0.5)"}>
                      {`D${cp.day}`}
                    </SvgText>
                    {passed && score !== "future" && (
                      <SvgText x={p.x} y={p.y + 8} fontSize={9} textAnchor="middle"
                        fill="#fff" opacity={0.85}>
                        {score === "good" ? "✓" : score === "warn" ? "~" : "✗"}
                      </SvgText>
                    )}
                  </G>
                );
              })}

              {/* ── User dot ── */}
              {day > 0 && (
                <G>
                  <Circle cx={userPos.x} cy={userPos.y} r={20}
                    fill="rgba(255,255,255,0.92)" stroke={colors.plumBright} strokeWidth={3} />
                  <Circle cx={userPos.x} cy={userPos.y} r={9} fill={colors.plumBright} />
                  {/* Pulse ring */}
                  <Circle cx={userPos.x} cy={userPos.y} r={26}
                    fill="none" stroke={colors.plumBright} strokeWidth={2} opacity={0.3} />
                </G>
              )}

            </Svg>
          </Animated.View>
        </View>
      </GestureDetector>

      {/* ── Minimap ── */}
      <View style={styles.minimap}>
        <Svg width={MM_W} height={MM_H}>
          <Rect x={0} y={0} width={MM_W} height={MM_H} rx={6} fill="rgba(62,27,51,0.85)" />
          {/* Scaled main path */}
          <Path
            d={W.map((p, i) => `${i === 0 ? "M" : "L"} ${4 + p.x * MM_SCALE} ${4 + p.y * MM_SCALE}`).join(" ")}
            stroke="rgba(255,255,255,0.25)" strokeWidth={3} fill="none"
          />
          {/* Completed portion */}
          <Path
            d={donePathD.replace(/(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g, (_, x, y) =>
              `${4 + parseFloat(x) * MM_SCALE} ${4 + parseFloat(y) * MM_SCALE}`)}
            stroke={colors.plumBright} strokeWidth={3} fill="none"
          />
          {/* User dot */}
          <Circle cx={4 + userPos.x * MM_SCALE} cy={4 + userPos.y * MM_SCALE} r={3} fill="#fff" />
          {/* Goal */}
          <Circle cx={4 + GOAL.x * MM_SCALE} cy={4 + GOAL.y * MM_SCALE} r={3} fill="#4F9D69" />
        </Svg>
        {/* Viewport indicator */}
        <Animated.View style={[styles.mmViewport, mmVpStyle]} />
      </View>

      {/* ── Legend ── */}
      <View style={styles.legend}>
        <LegendDot color="#4F9D69" label="On track" />
        <LegendDot color="#C9A24A" label="Partial" />
        <LegendDot color="#C76B4A" label="Detour" />
        <LegendDot color={colors.plumBright} label="You" />
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
  root: { flex: 1, backgroundColor: "#F8F2F6" },
  hint: { paddingHorizontal: 18, paddingVertical: 8, alignItems: "center" },
  hintText: { fontSize: 11.5, fontFamily: fonts.sansMedium, color: colors.textSoft },

  viewport: { flex: 1, overflow: "hidden" },

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

  legend: { flexDirection: "row", justifyContent: "center", gap: 18, paddingVertical: 10, backgroundColor: "#F8F2F6", borderTopWidth: 1, borderTopColor: "rgba(142,83,120,0.1)" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 10.5, fontFamily: fonts.sansMedium, color: colors.textSoft },
});
