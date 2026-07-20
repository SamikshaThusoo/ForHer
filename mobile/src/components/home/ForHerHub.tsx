import { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SvgXml } from "react-native-svg";
import {
  ArrowRight, Check, Footprints, TrendingUp, MessagesSquare, Stethoscope, FlaskConical,
  CalendarHeart, Briefcase, Utensils, Wind, Salad, Brain, Sun, HeartPulse, Star, Download, FileText, X, Droplet, Flame,
  type LucideIcon,
} from "lucide-react-native";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveDailyPlan } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { todaysMeals, type MealType } from "@/lib/forher/foodlog";
import { consultOnDay, isRetestDay, type ConsultInfo } from "@/lib/forher/consults";
import { getRating, setRating } from "@/lib/forher/consultfeedback";
import { fmtTarget } from "@/lib/forher/taskmeta";
import { avatarSvgFor } from "@/lib/avatar";
import { storage } from "@/lib/storage";
import type { CyclePhase } from "@/types/journey";
import { FocusCarousel } from "./FocusCarousel";
import { CardShell, CardIcon, Cta, carStyles, VARIANTS } from "./carousel-cards";
import { fonts } from "@/theme/tokens";

const COMM_ACCENT: Record<CyclePhase, { main: string; soft: string }> = {
  menstrual: { main: "#C76B7A", soft: "rgba(199,107,122,0.12)" },
  follicular: { main: "#C9A24A", soft: "rgba(201,162,74,0.14)" },
  ovulatory: { main: "#2F7A7A", soft: "rgba(47,122,122,0.12)" },
  luteal: { main: "#8E5378", soft: "rgba(142,83,120,0.12)" },
};
const TOPIC_TAGS = ["Pre-menopausal","Period pain","Endometriosis","Hormonal acne","PMOS / PCOS","Fertility","Stress & cycle"];
function todaysTopic() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return TOPIC_TAGS[dayOfYear % TOPIC_TAGS.length];
}

const WORK_PROMPT: Record<CyclePhase, string> = {
  menstrual: "Keep the load light — save deep work for later.",
  follicular: "A great week to start big projects.",
  ovulatory: "Focus and confidence peak — book the big conversations.",
  luteal: "Wind things down — protect your focus.",
};
const BODY_NOTE: Record<CyclePhase, string> = {
  menstrual: "Lower energy and possible cramps — rest is productive.",
  follicular: "Energy, mood and focus are rising.",
  ovulatory: "Peak energy, libido and confidence.",
  luteal: "Energy dips; bloating and cravings may build.",
};
const SPECIALIST: Record<string, { label: string; Icon: LucideIcon }> = {
  doctor: { label: "doctor", Icon: Stethoscope },
  nutritionist: { label: "nutritionist", Icon: Salad },
  psychologist: { label: "psychologist", Icon: Brain },
  dermatology: { label: "dermatologist", Icon: Sun },
  gynae: { label: "gynaecologist", Icon: HeartPulse },
};
const CONSULT_INCLUDES: Record<string, string[]> = {
  doctor: ["A review of your screening and AHC markers", "Your 90-day plan and any medication", "Time for questions about symptoms or side-effects"],
  nutritionist: ["A look at your food logs and blood-sugar patterns", "A meal plan tuned to your cycle", "Practical swaps for cravings and energy dips"],
  psychologist: ["A check-in on mood, stress and sleep", "Tools for the weeks PMOS hits hardest", "Support that works around your cycle"],
  dermatology: ["Skin and hair changes linked to PMOS", "A targeted skincare or treatment plan", "When and how to escalate"],
  gynae: ["A review of your cycle and hormonal markers", "Fertility or contraception questions", "Your next clinical steps"],
};
const TEST_INCLUDES = ["Fasting glucose and HbA1c", "A lipid panel", "Hormone panel (where needed)", "An outcomes review with your doctor"];

const pad = (n: number) => String(n).padStart(2, "0");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
function todayMood(): { feelings: string[]; cycle?: string } | null {
  try {
    const arr = JSON.parse(storage.getItem("forher.moodlog.v1") || "[]");
    if (!Array.isArray(arr)) return null;
    const e = [...arr].reverse().find((x: { day?: string }) => x.day === todayISO()) as { feelings?: string[]; cycle?: string } | undefined;
    return e ? { feelings: e.feelings ?? [], cycle: e.cycle } : null;
  } catch { return null; }
}

function DownloadBtn({ label }: { label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Pressable style={styles.cardBtn} onPress={() => setDone(true)}>
      {done ? <Check size={14} color="#fff" /> : <Download size={14} color="#fff" />}
      <Text style={styles.cardBtnText}>{done ? "Saved" : label}</Text>
    </Pressable>
  );
}

function ConsultDoneCard({ info }: { info: ConsultInfo }) {
  const sp = SPECIALIST[info.service] ?? { label: "care team", Icon: Stethoscope };
  const [rating, setRatingState] = useState(() => getRating(info.day, info.service));
  const rate = (n: number) => { setRatingState(n); setRating(info.day, info.service, n); };
  return (
    <CardShell variant="clinical">
      <CardIcon variant="clinical" Icon={sp.Icon} />
      <Text style={[carStyles.eyebrow, { color: VARIANTS.clinical.eyebrow, marginTop: 9 }]}>From your {sp.label}</Text>
      <Text style={carStyles.consultQ}>How was your consult?</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => rate(n)}>
            <Star size={20} fill={n <= rating ? "#F2C14E" : "none"} color={n <= rating ? "#F2C14E" : "#D6B9C6"} />
          </Pressable>
        ))}
      </View>
      <View style={carStyles.spacer} />
      <DownloadBtn label="Download prescription" />
    </CardShell>
  );
}

function CommAvatar({ seed }: { seed: string }) {
  return <View style={styles.avRing}><SvgXml xml={avatarSvgFor(seed, "flat")} width={27} height={27} /></View>;
}

/** The live For Her carousel on the Habit home (care-plan personas). */
export function ForHerHub() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const router = useRouter();
  const [detail, setDetail] = useState<{ kind: "consult" | "test"; service?: string; title: string } | null>(null);
  if (!fh.hydrated) return null;

  const tasks = resolveDailyPlan(persona, fh.day);
  const stepsTask = tasks.find((t) => t.id === "steps");
  const stepGoal = stepsTask ? fmtTarget(stepsTask.target) : "10,000 steps";

  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const lp = fh.cycleLog?.lastPeriod;
  const cyclePhase: CyclePhase | null = lp ? phaseForCycleDay(cycleDayFromLog(lp, L, new Date()), L, fh.cycleLog?.duration ?? 5) : null;
  const cycleDay = lp ? cycleDayFromLog(lp, L, new Date()) : null;
  const mood = todayMood();
  const meals = todaysMeals();
  const consult = consultOnDay(persona, fh.day);
  const isTestDay = isRetestDay(persona, fh.day);

  const mealCard = (m: MealType) => {
    const logged = meals[m];
    return (
      <CardShell variant="scan" onPress={() => router.push(`/food?meal=${m}` as never)} key={`meal-${m}`}>
        <CardIcon variant="scan" Icon={Utensils} />
        <Text style={[carStyles.eyebrow, { marginTop: 9 }]}>{cap(m)}</Text>
        <Text style={carStyles.title}>{logged ?? `Log ${m}`}</Text>
        <Text style={carStyles.sub}>{logged ? "Logged today — tap to change." : "Scan, say or search what you ate."}</Text>
        <Cta label={logged ? "Logged · update" : "Log food"} icon={logged ? "check" : "arrow"} />
      </CardShell>
    );
  };

  const cards: React.ReactNode[] = [];

  // 1 · Period / phase.
  if (!fh.cycleLogged) {
    cards.push(
      <CardShell variant="cycle" onPress={() => router.push("/cycle")} key="period-setup">
        <CardIcon variant="cycle" Icon={Droplet} />
        <Text style={carStyles.title}>Set up your tracker</Text>
        <Text style={carStyles.sub}>Tell us why you're here so we can tailor your cards.</Text>
        <Cta label="Set up now" color="#C76B7A" />
      </CardShell>,
    );
  } else if (cyclePhase && cycleDay) {
    cards.push(
      <CardShell variant="cycle" onPress={() => router.push("/cycle")} key="period-phase">
        <CardIcon variant="cycle" Icon={CalendarHeart} />
        <Text style={[carStyles.eyebrow, { marginTop: 9 }]}>Day {cycleDay} of {L}</Text>
        <Text style={carStyles.title}>{PHASE_LABEL[cyclePhase]} phase</Text>
        <Text style={carStyles.sub}>{BODY_NOTE[cyclePhase]}</Text>
        {mood
          ? <Cta label={mood.feelings.length ? `Feeling ${mood.feelings.slice(0, 3).join(", ").toLowerCase()}` : "Mood logged"} icon="check" color="#C76B7A" />
          : <Cta label="Log your mood" color="#C76B7A" onPress={() => router.push("/log/mood")} />}
      </CardShell>,
    );
  }

  // 2 · Consult day.
  if (consult) {
    const sp = SPECIALIST[consult.service] ?? { label: "care team", Icon: Stethoscope };
    cards.push(
      <CardShell variant="clinical" onPress={() => setDetail({ kind: "consult", service: consult.service, title: consult.label })} key="consult-up">
        <CardIcon variant="clinical" Icon={sp.Icon} />
        <Text style={[carStyles.eyebrow, { color: VARIANTS.clinical.eyebrow, marginTop: 9 }]}>From your care team</Text>
        <Text style={carStyles.title}>You've a consult today</Text>
        <Text style={carStyles.sub}>{consult.label}. Here's what to expect.</Text>
        <Cta label="View details" />
      </CardShell>,
    );
    cards.push(<ConsultDoneCard info={consult} key={`consult-done-${consult.day}`} />);
  }

  // 2b · Test day reminder.
  if (isTestDay) {
    cards.push(
      <CardShell variant="clinical" onPress={() => setDetail({ kind: "test", title: "Day 90 retest" })} key="test-reminder">
        <CardIcon variant="clinical" Icon={FlaskConical} />
        <Text style={[carStyles.eyebrow, { color: VARIANTS.clinical.eyebrow, marginTop: 9 }]}>This morning</Text>
        <Text style={carStyles.title}>Time for your test</Text>
        <Text style={carStyles.sub}>Fasting bloods for your Day 90 retest. Water is fine.</Text>
        <Cta label="View details" />
      </CardShell>,
    );
  }

  // 3 · Breakfast.
  cards.push(mealCard("breakfast"));

  // 4 · Step goal.
  cards.push(
    <CardShell variant="steps" key="step-goal">
      <CardIcon variant="steps" Icon={Footprints} />
      <Text style={[carStyles.eyebrow, { marginTop: 9 }]}>Today's goal</Text>
      <Text style={carStyles.title}>{stepGoal}</Text>
      <Text style={carStyles.sub}>Short walks after meals help steady your blood sugar.</Text>
    </CardShell>,
  );

  // 5 · Hormones at work.
  if (cyclePhase) {
    cards.push(
      <CardShell variant="learn" onPress={() => router.push("/hormones")} key="work">
        <CardIcon variant="learn" Icon={Briefcase} />
        <Text style={[carStyles.eyebrow, { marginTop: 9 }]}>Hormones at work</Text>
        <Text style={carStyles.title}>{PHASE_LABEL[cyclePhase]} phase</Text>
        <Text style={carStyles.sub}>{WORK_PROMPT[cyclePhase]}</Text>
        <Cta label="See your hormones" />
      </CardShell>,
    );
  }

  // 6 · Lunch.
  cards.push(mealCard("lunch"));

  // 7 · Breathing.
  cards.push(
    <CardShell variant="breathe" key="breathe">
      <CardIcon variant="breathe" Icon={Wind} />
      <Text style={[carStyles.eyebrow, { marginTop: 9 }]}>Reset</Text>
      <Text style={carStyles.title}>Take a breathing break</Text>
      <Text style={carStyles.sub}>A minute of slow breathing to steady cortisol and calm your mind.</Text>
    </CardShell>,
  );

  // Report — test days only.
  if (isTestDay) {
    cards.push(
      <CardShell variant="clinical" key="report">
        <CardIcon variant="clinical" Icon={FileText} />
        <Text style={[carStyles.eyebrow, { color: VARIANTS.clinical.eyebrow, marginTop: 9 }]}>Your results are in</Text>
        <Text style={carStyles.title}>Download your report</Text>
        <Text style={carStyles.sub}>Your latest labs are ready to view and share.</Text>
        <View style={carStyles.spacer} />
        <DownloadBtn label="Download report" />
      </CardShell>,
    );
  }

  // 8 · Dinner.
  cards.push(mealCard("dinner"));

  // 9 · Step status.
  cards.push(
    <CardShell variant="steps" key="step-status">
      <CardIcon variant="steps" Icon={Footprints} />
      <Text style={[carStyles.eyebrow, { marginTop: 9 }]}>End of day</Text>
      <Text style={carStyles.title}>8,240 / 10,000 steps</Text>
      <Text style={carStyles.sub}>From your Habit activity — 82% of today's goal.</Text>
    </CardShell>,
  );

  // 10 · Community.
  const comm = COMM_ACCENT[cyclePhase ?? "luteal"];
  const trendingTag = todaysTopic();
  cards.push(
    <CardShell variant="plain" customBg="#FFFFFF" onPress={() => router.push("/community")} key="community">
      <CardIcon Icon={MessagesSquare} bg={comm.soft} color={comm.main} />
      <Text style={carStyles.title}>Women in your phase are sharing</Text>
      <View style={styles.trendPill}>
        <Flame size={11} color="#C9622A" />
        <Text style={styles.trendPillText}>Trending · {trendingTag}</Text>
      </View>
      <View style={styles.avatars}>
        {[0, 1, 2].map((n) => <CommAvatar key={n} seed={`comm-${cyclePhase ?? "x"}-${n}`} />)}
        <Text style={[styles.avatarsLabel, { color: comm.main }]}>women like you</Text>
      </View>
      <Cta label="Open community" color={comm.main} />
    </CardShell>,
  );

  // 11 · Progress.
  cards.push(
    <CardShell variant="plain" onPress={() => router.push("/progress")} key="progress">
      <CardIcon Icon={TrendingUp} />
      <Text style={carStyles.title}>See today's progress</Text>
      <Text style={carStyles.sub}>Habits you're building + the markers that move.</Text>
      <Cta label="See progress" />
    </CardShell>,
  );

  return (
    <>
      <FocusCarousel>{cards}</FocusCarousel>
      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.detailBg} onPress={() => setDetail(null)}>
          <Pressable style={styles.detailCard} onPress={() => {}}>
            <Pressable style={styles.detailClose} onPress={() => setDetail(null)}><X size={16} color="#B5532F" /></Pressable>
            <Text style={styles.detailEyebrow}>
              {detail?.kind === "test" ? "Your retest" : `Your ${SPECIALIST[detail?.service ?? ""]?.label ?? "consult"}`}
            </Text>
            <Text style={styles.detailTitle}>{detail?.title}</Text>
            <Text style={styles.detailLead}>What's included</Text>
            <View style={styles.detailList}>
              {(detail?.kind === "test" ? TEST_INCLUDES : CONSULT_INCLUDES[detail?.service ?? ""] ?? []).map((it, i) => (
                <View key={i} style={styles.detailItem}><Check size={15} color="#4F9D69" /><Text style={styles.detailItemText}>{it}</Text></View>
              ))}
            </View>
            <Text style={styles.detailNote}>Book it and track it in your clinic.</Text>
            <Pressable style={styles.detailBtnWrap} onPress={() => { setDetail(null); router.push("/clinic"); }}>
              <View style={styles.detailBtn}><Text style={styles.detailBtnText}>Go to clinic</Text><ArrowRight size={14} color="#fff" /></View>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "#B5532F", borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  cardBtnText: { color: "#fff", fontSize: 12.5, fontFamily: fonts.sansBold },
  stars: { flexDirection: "row", gap: 7, marginTop: 14 },
  trendPill: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: "rgba(201,98,42,0.10)", borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9, marginTop: 6 },
  trendPillText: { fontSize: 10.5, fontFamily: fonts.sansBold, color: "#C9622A" },

  avatars: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 4 },
  avRing: { width: 27, height: 27, borderRadius: 14, borderWidth: 2, borderColor: "#fff", backgroundColor: "#fff", marginLeft: -8, overflow: "hidden" },
  avatarsLabel: { marginLeft: 10, fontSize: 11, fontFamily: fonts.sansBold },

  detailBg: { flex: 1, backgroundColor: "rgba(62,27,51,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  detailCard: { width: "100%", maxWidth: 320, backgroundColor: "#fff", borderRadius: 22, padding: 22, paddingTop: 24 },
  detailClose: { position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(181,83,47,0.1)" },
  detailEyebrow: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.6, textTransform: "uppercase", color: "#B5532F" },
  detailTitle: { fontFamily: fonts.serif, fontSize: 21, color: "#3E1B33", marginTop: 4 },
  detailLead: { fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: "#9A8A92", marginTop: 16 },
  detailList: { marginTop: 10, gap: 9 },
  detailItem: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  detailItemText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: fonts.sans, color: "#4A3340" },
  detailNote: { fontSize: 11.5, lineHeight: 17, fontFamily: fonts.sans, color: "#9A8A92", marginTop: 16 },
  detailBtnWrap: { marginTop: 16 },
  detailBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, paddingVertical: 13, backgroundColor: "#5B2A4A" },
  detailBtnText: { color: "#fff", fontSize: 14, fontFamily: fonts.sansBold },
});
