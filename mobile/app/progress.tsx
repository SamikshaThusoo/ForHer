import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle2, CalendarHeart, Stethoscope, Moon, Activity, Trophy, Lock, FlaskConical, Droplet, ClipboardEdit, Utensils, Laugh, GlassWater, Cookie, ArrowRight, Circle } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack, resolveDailyPlan, getPlanTouchpoints, getPhase, PHASE_BOUNDS } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { readDayLog } from "@/lib/forher/daylog";
import { todaysMeals } from "@/lib/forher/foodlog";
import { readHealthProfile, bmiFrom } from "@/lib/forher/healthprofile";
import { nextVisit, phaseActivity, logsInPhase, checkpointMarkers } from "@/lib/forher/progressview";
import { storage } from "@/lib/storage";
import { colors, fonts } from "@/theme/tokens";

const HABITS_KEY = (date: string) => `forher.habits.${date}`;
const readHabits = (): Record<string, boolean> => {
  try { return JSON.parse(storage.getItem(HABITS_KEY(new Date().toISOString().slice(0, 10))) || "{}"); } catch { return {}; }
};
const saveHabit = (id: string, val: boolean) => {
  const d = new Date().toISOString().slice(0, 10);
  const h = readHabits(); h[id] = val;
  storage.setItem(HABITS_KEY(d), JSON.stringify(h));
};

const PHASE_NAME: Record<string, string> = { foundation: "Foundation", build: "Build", milestone: "Milestone" };
const todayISO = () => new Date().toISOString().slice(0, 10);
const todayMood = (): string[] | null => {
  try {
    const arr = JSON.parse(storage.getItem("forher.moodlog.v1") || "[]");
    const e = Array.isArray(arr) ? [...arr].reverse().find((x: { day?: string }) => x.day === todayISO()) : null;
    return e ? (e.feelings ?? []) : null;
  } catch { return null; }
};

export default function Progress() {
  const { persona } = usePersona();
  const track = personaTrack(persona);
  const [tab, setTab] = useState<"daily" | "milestone">("daily");

  if (track === "none") {
    return (
      <Screen>
        <Header title="For Her · Progress" />
        <View style={styles.empty}>
          <Text style={styles.h1}>No program metrics yet</Text>
          <Text style={styles.emptySub}>You&apos;re on the companion track — keep tracking your cycle and mood, and we&apos;ll re-check over time.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="For Her · Progress" />
      <View style={styles.hero}>
        <Text style={styles.h1}>Your <Text style={styles.h1em}>progress</Text></Text>
        <Text style={styles.sub}>Today is the cursor; the 90 days is the frame.</Text>
      </View>

      <View style={styles.tabs}>
        {(["daily", "milestone"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === "daily" ? "Daily" : "Milestone"}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "daily" ? <DailyView /> : <MilestoneView />}
    </Screen>
  );
}

function Row({ Icon, children }: { Icon: typeof Moon; children: React.ReactNode }) {
  return (
    <View style={styles.dRow}>
      <Icon size={14} color={colors.plumBright} />
      <Text style={styles.dRowText}>{children}</Text>
    </View>
  );
}

function HabitRow({ id, label, Icon, done, onToggle, onOpen }: {
  id: string; label: string; Icon: typeof GlassWater; done: boolean;
  onToggle?: () => void; onOpen?: () => void;
}) {
  return (
    <Pressable onPress={onToggle ?? onOpen} style={styles.habitRow}>
      <View style={[styles.habitCheck, done && styles.habitCheckDone]}>
        {done ? <CheckCircle2 size={16} color="#fff" /> : <Circle size={16} color={colors.textMuted} />}
      </View>
      <Icon size={14} color={done ? "#4F9D69" : colors.plumBright} />
      <Text style={[styles.habitLabel, done && styles.habitLabelDone]}>{label}</Text>
      {onOpen && !done && <ArrowRight size={13} color={colors.textMuted} style={{ marginLeft: "auto" }} />}
    </Pressable>
  );
}

function DailyView() {
  const router = useRouter();
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const day = fh.day;
  const plan = resolveDailyPlan(persona, day);
  const doneToday = fh.done[day] ?? [];
  const completed = plan.filter((t) => doneToday.includes(t.id));
  const tasksDone = completed.length;
  const daysActive = Object.values(fh.done).filter((a) => a.length > 0).length;
  const isStart = fh.streak === 0 && tasksDone === 0 && daysActive === 0;

  const dayLog = readDayLog(persona.id);
  const mood = todayMood();
  const symptomsToday = dayLog[todayISO()]?.symptoms ?? [];

  const lp = fh.cycleLog?.lastPeriod;
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const cycleDay = lp ? cycleDayFromLog(lp, L, new Date()) : null;
  const cyclePhase = lp ? phaseForCycleDay(cycleDay!, L, fh.cycleLog?.duration ?? 5) : null;

  const upcoming = nextVisit(getPlanTouchpoints(persona), day);
  const inDays = upcoming ? upcoming.day - day : null;

  const [habits, setHabits] = useState<Record<string, boolean>>(readHabits);
  const toggleHabit = (id: string) => {
    const next = !habits[id];
    saveHabit(id, next);
    setHabits((h) => ({ ...h, [id]: next }));
  };

  const foodLogged = Object.keys(todaysMeals()).length > 0;
  const moodLogged = mood !== null;

  return (
    <View style={styles.body}>
      <Text style={styles.sectionHead}>Today&apos;s recap</Text>
      <View style={styles.stats}>
        <Stat num={String(fh.streak)} lab="day streak" />
        <Stat num={`${tasksDone}/${plan.length}`} lab="tasks today" />
        <Stat num={String(daysActive)} lab="active days" />
      </View>
      {isStart && <Text style={styles.startLine}>Day 1 — your streak starts today. One task counts.</Text>}

      <View style={styles.dCard}>
        <Text style={styles.dLabel}>Daily habits</Text>
        <HabitRow id="water" label="Drink 8 glasses of water" Icon={GlassWater} done={!!habits.water} onToggle={() => toggleHabit("water")} />
        <HabitRow id="nosnack" label="No snacking between meals" Icon={Cookie} done={!!habits.nosnack} onToggle={() => toggleHabit("nosnack")} />
        <HabitRow id="food" label="Log today's meals" Icon={Utensils} done={foodLogged} onOpen={() => router.push("/food")} />
        <HabitRow id="mood" label="Check in your mood" Icon={Laugh} done={moodLogged} onOpen={() => router.push("/log/mood")} />
      </View>

      <View style={styles.dCard}>
        <Text style={styles.dLabel}>What you did today</Text>
        {tasksDone > 0 ? completed.map((t) => (
          <View key={t.id} style={styles.dRow}><CheckCircle2 size={14} color="#4F9D69" /><Text style={styles.dRowText}>{t.title}</Text></View>
        )) : <Text style={styles.dMuted}>No tasks ticked yet — <Text style={styles.link} onPress={() => router.push("/")}>pick one</Text>.</Text>}
        <Row Icon={Moon}>{mood ? (mood.length ? `Mood: ${mood.slice(0, 3).join(", ").toLowerCase()}` : "Mood logged") : "Mood not logged"}</Row>
        <Row Icon={Activity}>{symptomsToday.length ? `Symptoms: ${symptomsToday.length} logged` : "No symptoms logged today"}</Row>
      </View>

      {/* End-of-day catch-up: surface cards not yet touched */}
      {(!foodLogged || !moodLogged || !habits.water || !habits.nosnack) && (
        <View style={styles.catchCard}>
          <Text style={styles.catchTitle}>Still to do today</Text>
          {!foodLogged && (
            <Pressable style={styles.catchRow} onPress={() => router.push("/food")}>
              <Utensils size={14} color={colors.plumBright} />
              <Text style={styles.catchText}>Log your meals</Text>
              <ArrowRight size={13} color={colors.textMuted} style={{ marginLeft: "auto" }} />
            </Pressable>
          )}
          {!moodLogged && (
            <Pressable style={styles.catchRow} onPress={() => router.push("/log/mood")}>
              <Laugh size={14} color={colors.plumBright} />
              <Text style={styles.catchText}>Mood check-in</Text>
              <ArrowRight size={13} color={colors.textMuted} style={{ marginLeft: "auto" }} />
            </Pressable>
          )}
          {!habits.water && (
            <Pressable style={styles.catchRow} onPress={() => toggleHabit("water")}>
              <GlassWater size={14} color={colors.plumBright} />
              <Text style={styles.catchText}>Mark water intake done</Text>
              <ArrowRight size={13} color={colors.textMuted} style={{ marginLeft: "auto" }} />
            </Pressable>
          )}
          {!habits.nosnack && (
            <Pressable style={styles.catchRow} onPress={() => toggleHabit("nosnack")}>
              <Cookie size={14} color={colors.plumBright} />
              <Text style={styles.catchText}>Mark no-snack done</Text>
              <ArrowRight size={13} color={colors.textMuted} style={{ marginLeft: "auto" }} />
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.dCard}>
        <Text style={styles.dLabel}>Where you are</Text>
        <Row Icon={CalendarHeart}>{cyclePhase ? `Cycle day ${cycleDay} · ${PHASE_LABEL[cyclePhase]}` : "Cycle not set up"}</Row>
        <Row Icon={Activity}>Day {day} of 90 · {PHASE_NAME[getPhase(day)]} phase</Row>
      </View>

      <View style={styles.dCard}>
        <Text style={styles.dLabel}>Upcoming</Text>
        {upcoming ? (
          <Row Icon={Stethoscope}>{upcoming.label} · {inDays === 0 ? "today" : `in ${inDays} day${inDays === 1 ? "" : "s"}`}</Row>
        ) : <Text style={styles.dMuted}>No appointments left in your plan.</Text>}
      </View>
    </View>
  );
}

function MilestoneView() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const enrollment = persona.pmos?.enrollmentDay ?? "2026-01-01";
  const visits = getPlanTouchpoints(persona);
  const dayLog = readDayLog(persona.id);
  const bmi = bmiFrom(readHealthProfile(persona.id));
  const CHECKPOINTS = [
    { day: 30, phase: PHASE_BOUNDS[0], title: "Foundation" },
    { day: 60, phase: PHASE_BOUNDS[1], title: "Build" },
    { day: 90, phase: PHASE_BOUNDS[2], title: "Final · Day 90" },
  ];

  return (
    <View style={styles.body}>
      {CHECKPOINTS.map((cp) => {
        const reached = fh.day >= cp.day;
        const { from, to } = cp.phase;
        const appts = visits.filter((v) => v.day >= from && v.day <= to);
        const act = phaseActivity(fh.done, from, to);
        const logs = logsInPhase(dayLog, enrollment, from, to);
        const markers = checkpointMarkers(persona, cp.day);
        return (
          <View key={cp.day} style={[styles.cp, !reached && styles.cpLocked]}>
            <View style={styles.cpHead}>
              <View style={styles.cpIcon}>{reached ? <Trophy size={16} color={colors.plumBright} /> : <Lock size={15} color={colors.textMuted} />}</View>
              <View>
                <Text style={styles.cpTitle}>{cp.title}</Text>
                <Text style={styles.cpSub}>Day {from}–{to}{reached ? "" : " · locked"}</Text>
              </View>
            </View>

            {reached ? (
              <>
                <View style={styles.cpBlock}>
                  <Text style={styles.cpLabel}>Appointments</Text>
                  {appts.length ? appts.map((a) => (
                    <View key={`${a.day}-${a.service}`} style={styles.dRow}>
                      {a.kind === "test" ? <FlaskConical size={13} color={colors.plumBright} /> : <Stethoscope size={13} color={colors.plumBright} />}
                      <Text style={styles.dRowText}>Day {a.day} · {a.label}</Text>
                    </View>
                  )) : <Text style={styles.dMuted}>None scheduled.</Text>}
                </View>

                {markers.length > 0 && (
                  <View style={styles.cpBlock}>
                    <Text style={styles.cpLabel}>Clinical markers</Text>
                    {markers.map((m) => (
                      <View key={m.key} style={styles.markerRow}>
                        <Text style={styles.dRowText}>{m.label}: <Text style={styles.cpVal}>{m.value.toFixed(m.decimals)}{m.unit}</Text></Text>
                        <View style={[styles.cpState, m.state === "measured" && styles.cpMeasured]}>
                          <Text style={[styles.cpStateText, m.state === "measured" && styles.cpMeasuredText]}>{m.state}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.cpBlock}>
                  <Text style={styles.cpLabel}>This phase</Text>
                  <Row Icon={CheckCircle2}>{act.tasks} tasks · {act.activeDays} active days</Row>
                  <Row Icon={Droplet}>{logs.periods} period{logs.periods === 1 ? "" : "s"} · {logs.symptomDays} symptom-day{logs.symptomDays === 1 ? "" : "s"} logged</Row>
                  <Row Icon={ClipboardEdit}>Health profile: {bmi ? `BMI ${bmi}` : "not updated"}</Row>
                </View>

                {cp.day === 90 && (
                  <View style={styles.cpBlock}>
                    <Text style={styles.cpLabel}>Day-90 re-test</Text>
                    <Row Icon={FlaskConical}>Full panel — HbA1c, HOMA-IR, lipids, hormones</Row>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.cpPreview}>Reached at Day {cp.day}. Your markers, appointments and activity for this phase appear here.</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Stat({ num, lab }: { num: string; lab: string }) {
  return <View style={styles.stat}><Text style={styles.statNum}>{num}</Text><Text style={styles.statLab}>{lab}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8 },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep },
  h1em: { fontFamily: fonts.serif, fontStyle: "italic", color: colors.plumBright },
  sub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 6 },
  empty: { padding: 30, alignItems: "center" },
  emptySub: { fontSize: 13, fontFamily: fonts.sans, color: colors.textSoft, textAlign: "center", marginTop: 10, lineHeight: 19 },

  tabs: { flexDirection: "row", gap: 8, marginHorizontal: 18, marginTop: 10, backgroundColor: "rgba(142,83,120,0.08)", borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
  tabOn: { backgroundColor: "#fff" },
  tabText: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.textSoft },
  tabTextOn: { color: colors.plumDeep },

  body: { paddingHorizontal: 18, marginTop: 14, gap: 10 },
  sectionHead: { fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.textMuted },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  statNum: { fontSize: 22, fontFamily: fonts.serif, color: colors.plumDeep },
  statLab: { fontSize: 10.5, fontFamily: fonts.sansMedium, color: colors.textSoft, marginTop: 2 },
  startLine: { fontSize: 12, fontFamily: fonts.sans, color: colors.plumBright, fontStyle: "italic" },

  dCard: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 14, gap: 7 },
  dLabel: { fontSize: 10.5, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.plumBright, marginBottom: 2 },
  dRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dRowText: { flex: 1, fontSize: 12.5, fontFamily: fonts.sans, color: colors.plumDeep, lineHeight: 18 },
  dMuted: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textMuted, fontStyle: "italic" },

  cp: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15, gap: 12 },
  cpLocked: { opacity: 0.62 },
  cpHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  cpIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)" },
  cpTitle: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.plumDeep },
  cpSub: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.textMuted, marginTop: 1 },
  cpBlock: { gap: 5 },
  cpLabel: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.textMuted },
  cpVal: { fontFamily: fonts.sansBold, color: colors.plumDeep },
  markerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cpState: { backgroundColor: "rgba(91,42,74,0.07)", borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  cpStateText: { fontSize: 10, fontFamily: fonts.sansBold, color: colors.textMuted },
  cpMeasured: { backgroundColor: "rgba(79,157,105,0.12)" },
  cpMeasuredText: { color: "#4F9D69" },
  cpPreview: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, fontStyle: "italic", lineHeight: 18 },
  link: { fontFamily: fonts.sansBold, color: colors.plumBright, textDecorationLine: "underline" },

  habitRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 5 },
  habitCheck: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.07)" },
  habitCheckDone: { backgroundColor: "#4F9D69" },
  habitLabel: { flex: 1, fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.plumDeep },
  habitLabelDone: { color: "#4F9D69", textDecorationLine: "line-through" },

  catchCard: { backgroundColor: "rgba(142,83,120,0.05)", borderWidth: 1, borderColor: "rgba(142,83,120,0.15)", borderRadius: 15, padding: 14, gap: 5 },
  catchTitle: { fontSize: 10.5, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.plumBright, marginBottom: 4 },
  catchRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 7, borderTopWidth: 1, borderTopColor: "rgba(142,83,120,0.08)" },
  catchText: { flex: 1, fontSize: 12.5, fontFamily: fonts.sans, color: colors.plumDeep },
});
