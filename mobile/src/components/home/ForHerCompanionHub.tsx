import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SvgXml } from "react-native-svg";
import { CalendarHeart, Activity, MessagesSquare, Droplet, Briefcase } from "lucide-react-native";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { avatarSvgFor } from "@/lib/avatar";
import { storage } from "@/lib/storage";
import type { CyclePhase } from "@/types/journey";
import { FocusCarousel } from "./FocusCarousel";
import { CardShell, CardIcon, Cta, carStyles } from "./carousel-cards";
import { fonts } from "@/theme/tokens";

const COMM_ACCENT: Record<CyclePhase, { main: string; soft: string }> = {
  menstrual: { main: "#C76B7A", soft: "rgba(199,107,122,0.12)" },
  follicular: { main: "#C9A24A", soft: "rgba(201,162,74,0.14)" },
  ovulatory: { main: "#2F7A7A", soft: "rgba(47,122,122,0.12)" },
  luteal: { main: "#8E5378", soft: "rgba(142,83,120,0.12)" },
};
const WORK_PROMPT: Record<CyclePhase, string> = {
  menstrual: "Lighter load today — save deep work for later in your cycle.",
  follicular: "Energy's climbing — a great week to start big projects.",
  ovulatory: "Focus and confidence peak — book the important conversations.",
  luteal: "Wind things down — protect your focus from overload.",
};
const todayISO = () => new Date().toISOString().slice(0, 10);
function todayMood(): { feelings: string[] } | null {
  try {
    const arr = JSON.parse(storage.getItem("forher.moodlog.v1") || "[]");
    if (!Array.isArray(arr)) return null;
    const e = [...arr].reverse().find((x: { day?: string }) => x.day === todayISO()) as { feelings?: string[] } | undefined;
    return e ? { feelings: e.feelings ?? [] } : null;
  } catch { return null; }
}

/** No-risk companion carousel: phase, hormone rhythm, day-at-work, community. */
export function ForHerCompanionHub() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const router = useRouter();
  if (!fh.hydrated) return null;

  const lp = fh.cycleLog?.lastPeriod;
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const cycleDay = lp ? cycleDayFromLog(lp, L, new Date()) : null;
  const phase: CyclePhase | null = lp ? phaseForCycleDay(cycleDayFromLog(lp, L, new Date()), L, fh.cycleLog?.duration ?? 5) : null;
  const mood = todayMood();
  const comm = COMM_ACCENT[phase ?? "luteal"];

  const cards: React.ReactNode[] = [];

  if (!lp) {
    cards.push(
      <CardShell variant="cycle" onPress={() => router.push("/cycle")} key="setup">
        <CardIcon variant="cycle" Icon={Droplet} />
        <Text style={carStyles.title}>Set up your tracker</Text>
        <Text style={carStyles.sub}>Tell us why you're here so we can tailor your cards.</Text>
        <Cta label="Set up now" color="#C76B7A" />
      </CardShell>,
    );
  } else {
    cards.push(
      <CardShell variant="cycle" onPress={() => router.push("/cycle")} key="phase">
        <CardIcon variant="cycle" Icon={CalendarHeart} />
        <Text style={[carStyles.eyebrow, { marginTop: 9 }]}>Day {cycleDay} of {L}</Text>
        <Text style={carStyles.title}>{phase ? `${PHASE_LABEL[phase]} phase` : "Your cycle"}</Text>
        <Text style={carStyles.sub}>Calendar, phase and next-period prediction.</Text>
        {mood
          ? <Cta label={mood.feelings.length ? `Feeling ${mood.feelings.slice(0, 3).join(", ").toLowerCase()}` : "Mood logged"} icon="check" color="#C76B7A" />
          : <Cta label="Log your mood" color="#C76B7A" onPress={() => router.push("/log/mood")} />}
      </CardShell>,
    );
  }

  cards.push(
    <CardShell variant="plain" onPress={() => router.push("/hormones")} key="hormones">
      <CardIcon Icon={Activity} />
      <Text style={carStyles.title}>Hormone rhythm</Text>
      <Text style={carStyles.sub}>How your hormones move across your cycle.</Text>
      <Cta label="Explore" />
    </CardShell>,
  );

  cards.push(
    <CardShell variant="learn" onPress={() => router.push("/hormones")} key="work">
      <CardIcon variant="learn" Icon={Briefcase} />
      <Text style={[carStyles.eyebrow, { marginTop: 9 }]}>Your day at work</Text>
      <Text style={carStyles.title}>{phase ? `${PHASE_LABEL[phase]} phase` : "Your cycle"}</Text>
      <Text style={carStyles.sub}>{phase ? WORK_PROMPT[phase] : "Log your cycle to get phase-based focus tips."}</Text>
      <Cta label="See your hormones" />
    </CardShell>,
  );

  cards.push(
    <CardShell variant="plain" customBg="#FFFFFF" onPress={() => router.push("/community")} key="community">
      <CardIcon Icon={MessagesSquare} bg={comm.soft} color={comm.main} />
      <Text style={carStyles.title}>Community</Text>
      <Text style={carStyles.sub}>Tips and check-ins from women like you.</Text>
      <View style={styles.avatars}>
        {[0, 1, 2].map((n) => (
          <View key={n} style={styles.avRing}><SvgXml xml={avatarSvgFor(`comm-${phase ?? "x"}-${n}`, "flat")} width={27} height={27} /></View>
        ))}
        <Text style={[styles.avatarsLabel, { color: comm.main }]}>women like you</Text>
      </View>
      <Cta label="Open community" color={comm.main} />
    </CardShell>,
  );

  return <FocusCarousel>{cards}</FocusCarousel>;
}

const styles = StyleSheet.create({
  avatars: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 4 },
  avRing: { width: 27, height: 27, borderRadius: 14, borderWidth: 2, borderColor: "#fff", backgroundColor: "#fff", marginLeft: -8, overflow: "hidden" },
  avatarsLabel: { marginLeft: 10, fontSize: 11, fontFamily: fonts.sansBold },
});
