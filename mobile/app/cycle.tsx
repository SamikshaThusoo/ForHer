import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { CycleRing } from "@/components/forher/CycleRing";
import { CycleOnboarding } from "@/components/forher/CycleOnboarding";
import { DayLogSheet } from "@/components/forher/DayLogSheet";
import { Florette, BloodDrop } from "@/components/forher/CycleArt";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, saveCycleLog, type CycleLog } from "@/lib/forher/state";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, ovulationDay, PHASE_LABEL, PHASE_COLOR } from "@/lib/forher/cycleview";
import { readDayLog, writeDayLog, periodDaysSet, isEmptyEntry, type DayLog, type DayEntry } from "@/lib/forher/daylog";
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
  const [sheetISO, setSheetISO] = useState<string | null>(null);

  const cycle = localCycle ?? fh.cycleLog;
  const logged = useMemo(() => periodDaysSet(dayLog), [dayLog]);

  // Keep cycleLog.lastPeriod / duration synced to the calendar's most-recent period start.
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
    if (cyc && (cyc.lastPeriod !== start || cyc.duration !== duration)) {
      const updated: CycleLog = { ...cyc, lastPeriod: start, duration };
      saveCycleLog(persona.id, updated);
      setLocalCycle(updated);
    }
  }, [dayLog, fh.cycleLog, localCycle, persona.id]);

  const onboard = (log: CycleLog) => {
    saveCycleLog(persona.id, log);
    setLocalCycle(log);
    if (log.lastPeriod && log.duration) {
      const start = fromISO(log.lastPeriod);
      const next: DayLog = { ...dayLog };
      for (let i = 0; i < log.duration; i++) {
        const iso = localISO(addDays(start, i));
        next[iso] = { ...(next[iso] ?? {}), period: true };
      }
      setDayLog(next);
      writeDayLog(persona.id, next);
    }
  };

  const saveDay = (iso: string, entry: DayEntry) => {
    setDayLog((prev) => {
      const next = { ...prev };
      if (isEmptyEntry(entry)) delete next[iso]; else next[iso] = entry;
      writeDayLog(persona.id, next);
      return next;
    });
  };

  const L = cycleLengthFor(persona, cycle?.cycleLength);
  const duration = cycle?.duration ?? 5;
  const ovCd = ovulationDay(L);
  const sorted = [...logged].sort();
  const startsL = sorted.filter((s) => !logged.has(localISO(addDays(fromISO(s), -1))));
  const pastStarts = startsL.filter((s) => dayNum(fromISO(s)) <= dayNum(today));
  const anchorISO = pastStarts.length ? pastStarts[pastStarts.length - 1] : (cycle?.lastPeriod ?? localISO(today));
  const anchor = fromISO(anchorISO);
  const predicted = useMemo(() => {
    const set = new Set<string>();
    for (let k = 1; k <= 4; k++) { const ps = addDays(anchor, k * L); for (let i = 0; i < duration; i++) set.add(localISO(addDays(ps, i))); }
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

  // ---- Not set up → onboarding ----
  if (!cycle) {
    return (
      <Screen>
        <Header title="For Her · Cycle" />
        <View style={styles.hero}>
          <Text style={styles.h1}>Your <Text style={styles.h1em}>cycle</Text></Text>
          <Text style={styles.introSub}>We won&apos;t show a phase until you&apos;ve logged your cycle — no guessing on our part.</Text>
        </View>
        <CycleOnboarding onSave={onboard} />
      </Screen>
    );
  }

  // ---- Pregnant → no cycle tracking ----
  if (cycle.intent === "pregnant") {
    const weeks = cycle.weeksPregnant ?? 0;
    const trimester = weeks <= 13 ? "First" : weeks <= 27 ? "Second" : "Third";
    return (
      <Screen>
        <Header title="For Her · Cycle" />
        <View style={styles.hero}><Text style={styles.h1}>Your <Text style={styles.h1em}>pregnancy</Text></Text></View>
        <View style={styles.pregCard}>
          <Text style={styles.pregWeeks}>{weeks}<Text style={styles.pregUnit}> weeks</Text></Text>
          <Text style={styles.pregTri}>{trimester} trimester</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="For Her · Cycle" />
      <View style={styles.hero}><Text style={styles.h1}>Your <Text style={styles.h1em}>cycle</Text></Text></View>

      <CycleRing L={L} cycleDay={cycleDay} todayCd={todayCd} duration={duration} onPhaseTap={setSelCd} />

      <View style={styles.scrubWrap}>
        <Scrubber value={cycleDay} max={L} onChange={setSelCd} />
        <View style={styles.scrubMeta}>
          <Text style={styles.scrubHint}>Drag to explore any day</Text>
          {selCd !== null && selCd !== todayCd && (
            <PressableScale onPress={() => setSelCd(null)} style={styles.backToday}>
              <RotateCcw size={12} color={colors.plumBright} /><Text style={styles.backTodayText}>Back to today</Text>
            </PressableScale>
          )}
        </View>
      </View>

      <View style={styles.chips}>
        <View style={styles.chip}>
          <View style={styles.chipIcon}><BloodDrop size={19} /></View>
          <View style={styles.chipText}>
            <Text style={styles.chipLabel}>Next period</Text>
            <Text style={styles.chipVal}>{fmt(nextStart)} · {rel(periodIn)}</Text>
          </View>
        </View>
        <View style={styles.chip}>
          <View style={styles.chipIcon}><Florette size={19} color="#4F9D69" /></View>
          <View style={styles.chipText}>
            <Text style={styles.chipLabel}>Ovulation</Text>
            <Text style={styles.chipVal}>{fmt(ovDate)} · {rel(daysToOv)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.insight, { backgroundColor: `${insightColor}14`, borderColor: `${insightColor}33` }]}>
        <Text style={[styles.insightTag, { color: insightColor }]}>{PHASE_LABEL[scrubPhase]} phase{isToday ? " · today" : ""}</Text>
        <Text style={styles.insightText}>{INSIGHT[scrubPhase]}</Text>
      </View>

      <Text style={styles.tapHint}>Tap any day to log flow &amp; symptoms. Future periods are predicted (outlined).</Text>

      <View style={styles.monthNav}>
        <PressableScale onPress={() => setMonthOffset((o) => Math.max(-12, o - 1))} style={styles.monthNavBtn}><ChevronLeft size={18} color={colors.plum} /></PressableScale>
        <Text style={styles.monthNavLabel}>{viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
        <PressableScale onPress={() => setMonthOffset((o) => Math.min(12, o + 1))} style={styles.monthNavBtn}><ChevronRight size={18} color={colors.plum} /></PressableScale>
      </View>

      <Month month={viewMonth} anchor={anchor} anchorISO={anchorISO} L={L} ovCd={ovCd} logged={logged} predicted={predicted} dayLog={dayLog} today={today} selCd={selCd}
        onTap={(iso, cd) => { setSelCd(cd); setSheetISO(iso); }} />

      <View style={styles.legend}>
        <View style={styles.legItem}><BloodDrop size={15} /><Text style={styles.legLabel}>Period</Text></View>
        <View style={styles.legItem}><BloodDrop size={14} fill={false} /><Text style={styles.legLabel}>Predicted</Text></View>
        <View style={styles.legItem}><View style={styles.legFertile} /><Text style={styles.legLabel}>Fertile</Text></View>
        <View style={styles.legItem}><Florette size={15} color="#2F6B45" /><Text style={styles.legLabel}>Ovulation</Text></View>
        <View style={styles.legItem}><View style={styles.legSymptom} /><Text style={styles.legLabel}>Symptoms</Text></View>
      </View>

      <DayLogSheet
        dateISO={sheetISO}
        entry={sheetISO ? (dayLog[sheetISO] ?? {}) : {}}
        labelDate={sheetISO ? fromISO(sheetISO).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long" }) : ""}
        onSave={saveDay}
        onClose={() => setSheetISO(null)}
      />
    </Screen>
  );
}

function Month({ month, anchor, anchorISO, L, ovCd, logged, predicted, dayLog, today, selCd, onTap }: {
  month: Date; anchor: Date; anchorISO: string; L: number; ovCd: number;
  logged: Set<string>; predicted: Set<string>; dayLog: DayLog; today: Date; selCd: number | null;
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
        const hasSymptoms = (dayLog[iso]?.symptoms?.length ?? 0) > 0;
        return (
          <PressableScale key={i} onPress={() => onTap(iso, cd)} style={styles.cell}>
            <View style={[styles.day, isFertile && styles.dayFertile, isLogged && styles.dayLogged, isOv && styles.dayOv, isTodayCell && styles.dayToday, isSel && styles.daySel]}>
              <Text style={[styles.dayNum, isLogged && styles.dayNumLogged, isPred && styles.dayNumPred, isFertile && styles.dayNumFertile, isOv && styles.dayNumOv]}>{d}</Text>
              <View style={styles.dayArt}>
                {isLogged ? <BloodDrop size={12} /> : isPred ? <BloodDrop size={11} fill={false} /> : isOv ? <Florette size={13} color="#2F6B45" bright /> : null}
              </View>
              {hasSymptoms && <View style={styles.symptomDot} />}
            </View>
          </PressableScale>
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
    <View style={styles.trackHit} onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => update(e.nativeEvent.locationX)} onResponderMove={(e) => update(e.nativeEvent.locationX)}>
      <View style={styles.trackBar} />
      <View pointerEvents="none" style={[styles.thumb, { left: left - 11 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep },
  h1em: { fontFamily: fonts.serif, fontStyle: "italic", color: colors.plumBright },
  introSub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 18 },

  pregCard: { marginHorizontal: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 24, alignItems: "center" },
  pregWeeks: { fontSize: 40, fontFamily: fonts.serif, color: colors.plumDeep },
  pregUnit: { fontSize: 16, fontFamily: fonts.sans, color: colors.textSoft },
  pregTri: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.plumBright, marginTop: 6 },

  scrubWrap: { marginHorizontal: 18, marginTop: 10 },
  trackHit: { height: 24, justifyContent: "center" },
  trackBar: { height: 8, borderRadius: 999, backgroundColor: "rgba(142,83,120,0.18)" },
  thumb: { position: "absolute", width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, borderColor: "#fff", backgroundColor: colors.plumBright, top: 2 },
  scrubMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  scrubHint: { fontSize: 10.5, fontFamily: fonts.sans, color: colors.textMuted },
  backToday: { flexDirection: "row", alignItems: "center", gap: 4 },
  backTodayText: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.plumBright },

  chips: { flexDirection: "row", gap: 10, marginHorizontal: 18, marginTop: 14 },
  chip: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff",
    borderWidth: 1, borderColor: "rgba(91,42,74,0.1)", borderRadius: 15, paddingVertical: 11, paddingHorizontal: 12,
    shadowColor: "#5B2A4A", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
  chipIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.08)" },
  chipText: { flex: 1, gap: 2 },
  chipLabel: { fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.textMuted },
  chipVal: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.plumDeep, lineHeight: 15 },

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
  day: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  dayNum: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.plumDeep, lineHeight: 14 },
  dayNumLogged: { color: "#A23C53", fontFamily: fonts.sansBold },
  dayNumPred: { color: "#C76B7A", fontFamily: fonts.sansBold },
  dayNumFertile: { color: "#2F6B45", fontFamily: fonts.sansBold },
  dayNumOv: { color: "#235539", fontFamily: fonts.sansBold },
  dayArt: { height: 12, alignItems: "center", justifyContent: "center" },
  dayLogged: { backgroundColor: "rgba(199,107,122,0.18)" },
  dayFertile: { backgroundColor: "rgba(79,157,105,0.18)" },
  dayOv: { backgroundColor: "rgba(79,157,105,0.3)" },
  dayToday: { borderColor: "#3E1B33" },
  daySel: { borderColor: colors.plumBright, borderWidth: 2.5, transform: [{ scale: 1.07 }] },
  symptomDot: { position: "absolute", top: 3, right: 3, width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.plumBright },

  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 16, paddingHorizontal: 18 },
  legItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legFertile: { width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(79,157,105,0.45)" },
  legSymptom: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.plumBright },
  legLabel: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.textSoft },
});
