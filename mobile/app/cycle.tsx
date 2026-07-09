import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { CycleRing } from "@/components/forher/CycleRing";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, saveCycleLog, type CycleLog } from "@/lib/forher/state";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, ovulationDay, PHASE_LABEL, PHASE_COLOR } from "@/lib/forher/cycleview";
import { readDayLog, writeDayLog, periodDaysSet, type DayLog } from "@/lib/forher/daylog";
import type { CyclePhase } from "@/types/journey";
import { colors, fonts } from "@/theme/tokens";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const pad = (n: number) => String(n).padStart(2, "0");
const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayNum = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

const INSIGHT: Record<CyclePhase, string> = {
  menstrual: "Energy is naturally lower right now. Rest counts as progress.",
  follicular: "Estrogen is climbing. A good window to start something new.",
  ovulatory: "Estrogen peaks and energy is high. Lean into the big conversations.",
  luteal: "Winding down. Gentle movement and earlier nights help.",
};

export default function Cycle() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const today = new Date();
  const [dayLog, setDayLog] = useState<DayLog>(() => readDayLog(persona.id));
  const [localCycle, setLocalCycle] = useState<CycleLog | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selCd, setSelCd] = useState<number | null>(null);

  const cycle = localCycle ?? fh.cycleLog;
  const logged = useMemo(() => periodDaysSet(dayLog), [dayLog]);

  // Keep cycleLog.lastPeriod / duration synced to the calendar's most-recent period
  // start (creating the log on the first tap) so every phase surface agrees.
  useEffect(() => {
    const set = periodDaysSet(dayLog);
    if (set.size === 0) return;
    const now = new Date();
    const days = [...set].sort();
    const starts = days.filter((s) => !set.has(localISO(addDays(fromISO(s), -1))));
    const past = starts.filter((s) => dayNum(fromISO(s)) <= dayNum(now));
    const start = past.length ? past[past.length - 1] : null;
    if (!start) return;
    let runLen = 0, d = fromISO(start);
    while (set.has(localISO(d))) { runLen++; d = addDays(d, 1); }
    const duration = Math.max(1, Math.min(runLen, 10));
    const cyc = localCycle ?? fh.cycleLog;
    if (cyc?.intent === "pregnant") return;
    if (!cyc || cyc.lastPeriod !== start || cyc.duration !== duration) {
      const updated: CycleLog = { ...(cyc ?? { intent: "track" }), lastPeriod: start, duration };
      saveCycleLog(persona.id, updated);
      setLocalCycle(updated);
    }
  }, [dayLog, fh.cycleLog, localCycle, persona.id]);

  const toggleDay = (iso: string, cd: number) => {
    setSelCd(cd);
    setDayLog((prev) => {
      const next = { ...prev };
      const cur = next[iso] ?? {};
      if (cur.period) {
        const { period, ...rest } = cur;
        if (Object.keys(rest).length) next[iso] = rest; else delete next[iso];
      } else {
        next[iso] = { ...cur, period: true };
      }
      writeDayLog(persona.id, next);
      return next;
    });
  };

  const L = cycleLengthFor(persona, cycle?.cycleLength);
  const duration = cycle?.duration ?? 5;
  const ovCd = ovulationDay(L);

  const sorted = [...logged].sort();
  const starts = sorted.filter((s) => !logged.has(localISO(addDays(fromISO(s), -1))));
  const pastStarts = starts.filter((s) => dayNum(fromISO(s)) <= dayNum(today));
  const hasData = logged.size > 0 || !!cycle?.lastPeriod;
  const anchorISO = pastStarts.length ? pastStarts[pastStarts.length - 1] : (cycle?.lastPeriod ?? localISO(today));
  const anchor = fromISO(anchorISO);

  const predicted = useMemo(() => {
    const set = new Set<string>();
    for (let k = 1; k <= 4; k++) {
      const ps = addDays(anchor, k * L);
      for (let i = 0; i < duration; i++) set.add(localISO(addDays(ps, i)));
    }
    return set;
  }, [anchorISO, L, duration]);

  const todayCd = cycleDayFromLog(anchorISO, L, today);
  const cycleDay = selCd ?? todayCd;
  const scrubPhase = phaseForCycleDay(cycleDay, L, duration);
  const isToday = cycleDay === todayCd;

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const daysToOv = ((ovCd - todayCd) % L + L) % L;
  const ovDate = addDays(today, daysToOv);
  const nextStart = addDays(anchor, dayNum(today) - dayNum(anchor) < L ? L : Math.ceil((dayNum(today) - dayNum(anchor) + 1) / L) * L);
  const periodIn = dayNum(nextStart) - dayNum(today);
  const rel = (n: number) => (n <= 0 ? "today" : `in ${n} day${n === 1 ? "" : "s"}`);
  const insightColor = PHASE_COLOR[scrubPhase];

  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

  return (
    <Screen>
      <Header title="For Her · Cycle" />
      <View style={styles.hero}>
        <Text style={styles.h1}>Your <Text style={styles.h1em}>cycle</Text></Text>
        {!hasData && <Text style={styles.introSub}>Tap the day your last period started to see your phases.</Text>}
      </View>

      {hasData && (
        <>
          <CycleRing L={L} cycleDay={cycleDay} todayCd={todayCd} duration={duration} onPhaseTap={setSelCd} />

          <View style={styles.scrubWrap}>
            <Scrubber value={cycleDay} max={L} onChange={setSelCd} />
            <View style={styles.scrubMeta}>
              <Text style={styles.scrubHint}>Drag to explore any day</Text>
              {selCd !== null && selCd !== todayCd && (
                <Pressable onPress={() => setSelCd(null)} style={styles.backToday}>
                  <RotateCcw size={12} color={colors.plumBright} />
                  <Text style={styles.backTodayText}>Back to today</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.chips}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Next period</Text>
              <Text style={styles.chipVal}>{fmt(nextStart)} · {rel(periodIn)}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>Ovulation</Text>
              <Text style={styles.chipVal}>{fmt(ovDate)} · {rel(daysToOv)}</Text>
            </View>
          </View>

          <View style={[styles.insight, { backgroundColor: `${insightColor}14`, borderColor: `${insightColor}33` }]}>
            <Text style={[styles.insightTag, { color: insightColor }]}>{PHASE_LABEL[scrubPhase]} phase{isToday ? " · today" : ""}</Text>
            <Text style={styles.insightText}>{INSIGHT[scrubPhase]}</Text>
          </View>
        </>
      )}

      <Text style={styles.tapHint}>Tap any day to log your period. Future periods are predicted (outlined).</Text>

      <View style={styles.monthNav}>
        <Pressable onPress={() => setMonthOffset((o) => Math.max(-12, o - 1))} style={styles.monthNavBtn}><ChevronLeft size={18} color={colors.plum} /></Pressable>
        <Text style={styles.monthNavLabel}>{viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
        <Pressable onPress={() => setMonthOffset((o) => Math.min(12, o + 1))} style={styles.monthNavBtn}><ChevronRight size={18} color={colors.plum} /></Pressable>
      </View>

      <Month month={viewMonth} anchor={anchor} anchorISO={anchorISO} L={L} ovCd={ovCd} logged={logged} predicted={predicted} today={today} selCd={selCd} onTap={toggleDay} />

      <View style={styles.legend}>
        <LegendItem color={PHASE_COLOR.menstrual} label="Period" />
        <LegendItem color={PHASE_COLOR.menstrual} label="Predicted" outline />
        <LegendItem color="#4F9D69" label="Fertile" faint />
        <LegendItem color="#4F9D69" label="Ovulation" />
      </View>
    </Screen>
  );
}

function Month({ month, anchor, anchorISO, L, ovCd, logged, predicted, today, selCd, onTap }: {
  month: Date; anchor: Date; anchorISO: string; L: number; ovCd: number;
  logged: Set<string>; predicted: Set<string>; today: Date; selCd: number | null;
  onTap: (iso: string, cd: number) => void;
}) {
  const year = month.getFullYear(), m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const selISO = selCd != null ? localISO(addDays(anchor, selCd - 1)) : null;

  return (
    <View style={styles.grid}>
      {WEEKDAYS.map((w, i) => <Text key={`w${i}`} style={styles.wd}>{w}</Text>)}
      {cells.map((d, i) => {
        if (d == null) return <View key={i} style={styles.cell} />;
        const date = new Date(year, m, d);
        const iso = localISO(date);
        const isLogged = logged.has(iso);
        const isPred = !isLogged && predicted.has(iso);
        const cd = cycleDayFromLog(anchorISO, L, date);
        const fromAnchor = dayNum(date) >= dayNum(anchor);
        const isOv = fromAnchor && cd === ovCd && !isLogged;
        const isFertile = fromAnchor && !isLogged && !isPred && cd >= ovCd - 5 && cd <= ovCd;
        const isTodayCell = iso === localISO(today);
        const isSel = selISO === iso;
        return (
          <Pressable key={i} onPress={() => onTap(iso, cd)} style={styles.cell}>
            <View style={[
              styles.day,
              isFertile && styles.dayFertile,
              isLogged && styles.dayLogged,
              isPred && styles.dayPred,
              isOv && styles.dayOv,
              isTodayCell && styles.dayToday,
              isSel && styles.daySel,
            ]}>
              <Text style={[styles.dayNum, (isLogged || isOv) && styles.dayNumOn]}>{d}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Scrubber({ value, max, onChange }: { value: number; max: number; onChange: (d: number) => void }) {
  const [w, setW] = useState(0);
  const update = (x: number) => { if (w > 0) onChange(Math.round(1 + Math.max(0, Math.min(1, x / w)) * (max - 1))); };
  const left = w > 0 ? ((value - 1) / (max - 1)) * w : 0;
  return (
    <View style={styles.trackHit}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => update(e.nativeEvent.locationX)} onResponderMove={(e) => update(e.nativeEvent.locationX)}>
      <View style={styles.trackBar} />
      <View pointerEvents="none" style={[styles.thumb, { left: left - 11 }]} />
    </View>
  );
}

function LegendItem({ color, label, outline, faint }: { color: string; label: string; outline?: boolean; faint?: boolean }) {
  return (
    <View style={styles.legItem}>
      <View style={[styles.legDot, { backgroundColor: faint ? `${color}44` : outline ? "transparent" : color, borderWidth: outline ? 1.5 : 0, borderColor: color }]} />
      <Text style={styles.legLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep },
  h1em: { fontFamily: fonts.serif, fontStyle: "italic", color: colors.plumBright },
  introSub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 18 },

  scrubWrap: { marginHorizontal: 18, marginTop: 10 },
  trackHit: { height: 24, justifyContent: "center" },
  trackBar: { height: 8, borderRadius: 999, backgroundColor: "rgba(142,83,120,0.18)" },
  thumb: { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, borderColor: "#fff", backgroundColor: colors.plumBright, top: 2 },
  scrubMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  scrubHint: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.textMuted },
  backToday: { flexDirection: "row", alignItems: "center", gap: 4 },
  backTodayText: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.plumBright },

  chips: { flexDirection: "row", gap: 10, marginHorizontal: 18, marginTop: 14 },
  chip: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12 },
  chipLabel: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.textMuted },
  chipVal: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 4 },

  insight: { marginHorizontal: 18, marginTop: 14, borderWidth: 1, borderRadius: 15, padding: 13 },
  insightTag: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase" },
  insightText: { fontSize: 12.5, fontFamily: fonts.sans, color: "#4A3A44", marginTop: 6, lineHeight: 19 },

  tapHint: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.textMuted, textAlign: "center", marginHorizontal: 24, marginTop: 18, lineHeight: 15 },

  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 30, marginTop: 12 },
  monthNavBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line },
  monthNavLabel: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.plumDeep },

  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, marginTop: 10 },
  wd: { width: `${100 / 7}%`, textAlign: "center", fontSize: 10, fontFamily: fonts.sansBold, color: colors.textMuted, marginBottom: 6 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  dayNum: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.plumDeep },
  dayNumOn: { color: "#fff" },
  dayLogged: { backgroundColor: PHASE_COLOR.menstrual },
  dayPred: { borderColor: PHASE_COLOR.menstrual, borderStyle: "dashed" },
  dayFertile: { backgroundColor: "rgba(79,157,105,0.14)" },
  dayOv: { backgroundColor: "#4F9D69" },
  dayToday: { borderColor: colors.plum },
  daySel: { borderColor: colors.plumBright, borderWidth: 2 },

  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 16, paddingHorizontal: 18 },
  legItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legDot: { width: 12, height: 12, borderRadius: 6 },
  legLabel: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.textSoft },
});
