import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, type ViewStyle } from "react-native";
import { Bookmark, Heart, Check, Sprout } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { Avatar } from "@/components/ui/Avatar";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { storage } from "@/lib/storage";
import { colors, fonts, phaseAccent } from "@/theme/tokens";
import type { CyclePhase } from "@/types/journey";

const FEELINGS = ["Energetic", "Calm", "Motivated", "Tired", "Crampy", "Bloated", "Moody", "Anxious"];

type Tip = { kind: "Peer" | "Pacing" | "Diet"; text: string; saved: number };
type Post = { name: string; text: string; likes: number };

const TIPS: Record<CyclePhase, Tip[]> = {
  menstrual: [
    { kind: "Peer", text: "A warm compress and an earlier night took the edge off my cramps.", saved: 312 },
    { kind: "Pacing", text: "Low energy? A 10-minute walk still counts — be gentle with yourself.", saved: 188 },
    { kind: "Diet", text: "Iron-friendly bowls — rajma or spinach-dal — help replenish what your period takes.", saved: 241 },
  ],
  follicular: [
    { kind: "Pacing", text: "Energy usually climbs now — a good week for a slightly longer walk or a new class.", saved: 203 },
    { kind: "Peer", text: "I feel clearer-headed these days — I save my harder tasks for this phase.", saved: 174 },
    { kind: "Diet", text: "Fermented foods like idli, dosa or yogurt fit nicely as estrogen rises.", saved: 132 },
  ],
  ovulatory: [
    { kind: "Peer", text: "I feel my most confident around now — I lean into it where I can.", saved: 219 },
    { kind: "Pacing", text: "Strength and stamina often peak — a harder session feels good if you're up to it.", saved: 161 },
    { kind: "Diet", text: "Hydrating foods — cucumber, watermelon, coconut water — keep me feeling light.", saved: 143 },
  ],
  luteal: [
    { kind: "Pacing", text: "Energy can taper before my period — gentle yoga or a calm walk works for me.", saved: 197 },
    { kind: "Peer", text: "Mood and cravings shift now — being a little kinder to myself really helps.", saved: 228 },
    { kind: "Diet", text: "Magnesium-rich foods — pumpkin seeds, banana, a little dark chocolate — ease the tension.", saved: 184 },
  ],
};

const POSTS: Record<CyclePhase, Post[]> = {
  menstrual: [
    { name: "Ananya", text: "Day 2 and the cramps are real. Hot water bottle + dal-chawal = survival.", likes: 24 },
    { name: "Priya", text: "Logging my period every month finally showed me my pattern. Game changer.", likes: 18 },
  ],
  follicular: [
    { name: "Reema", text: "Signed up for a dance class this week — feeling the energy bump!", likes: 31 },
    { name: "Kavya", text: "Besan chilla for breakfast has kept my mid-morning crash away.", likes: 15 },
  ],
  ovulatory: [
    { name: "Sneha", text: "Best gym week of the month, every month. Riding the wave.", likes: 27 },
    { name: "Divya", text: "Coconut water + a long walk. Feeling unstoppable today.", likes: 12 },
  ],
  luteal: [
    { name: "Meher", text: "Cravings hitting hard. Swapped the biscuit for dark chocolate + nuts.", likes: 22 },
    { name: "Aditi", text: "Gentle yoga over HIIT this week and my body thanked me.", likes: 19 },
  ],
};

const PACING: Record<CyclePhase, string> = {
  menstrual: "Women in their menstrual phase average ~5,200 steps — gentler is normal.",
  follicular: "Women in their follicular phase average ~7,800 steps this week.",
  ovulatory: "Women in their ovulatory phase log the most strength sessions — 2.4 a week.",
  luteal: "Women in their luteal phase average ~6,100 steps — easing off is common.",
};

const KIND_LABEL: Record<Tip["kind"], string> = {
  Peer: "From the community",
  Pacing: "Keeping your pace",
  Diet: "From the kitchen",
};

const REACT_KEY = "forher.community.reactions.v1";
const readReactions = (): Record<string, boolean> => {
  try { const o = JSON.parse(storage.getItem(REACT_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch { return {}; }
};

type MyPost = { note: string; feelings: string[]; phase: string; at: string };
const readMyPosts = (): MyPost[] => {
  try { const a = JSON.parse(storage.getItem("forher.community.v1") || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
};

function ReactionPill({ base, on, onToggle, kind }: { base: number; on: boolean; onToggle: () => void; kind: "save" | "like" }) {
  const count = base + (on ? 1 : 0);
  const Icon = kind === "save" ? Bookmark : Heart;
  return (
    <Pressable onPress={onToggle} style={[styles.react, on && styles.reactOn]} accessibilityRole="button">
      <Icon size={14} color={on ? "#fff" : colors.plumBright} fill={on ? "#fff" : "none"} strokeWidth={2} />
      <Text style={[styles.reactCount, on && styles.reactTextOn]}>{count.toLocaleString()}</Text>
      {kind === "save" && <Text style={[styles.reactLabel, on && styles.reactTextOn]}>{on ? "saved" : "women saved this"}</Text>}
    </Pressable>
  );
}

export default function Community() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const today = new Date();
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const logged = !!fh.cycleLog?.lastPeriod;
  const phase: CyclePhase = fh.cycleLog?.lastPeriod
    ? phaseForCycleDay(cycleDayFromLog(fh.cycleLog.lastPeriod, L, today), L, fh.cycleLog?.duration ?? 5)
    : "follicular";
  const carePlan = personaTrack(persona) !== "none";
  const phaseWord = PHASE_LABEL[phase].toLowerCase();
  const a = phaseAccent[phase];

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(false);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [reactions, setReactions] = useState<Record<string, boolean>>({});

  useEffect(() => { setMyPosts(readMyPosts()); setReactions(readReactions()); }, []);
  useEffect(() => {
    if (!shared) return;
    const t = setTimeout(() => setShared(false), 3600);
    return () => clearTimeout(t);
  }, [shared]);

  const avatars = useMemo(() => ({
    tips: TIPS[phase].map((_, i) => `fh-tip-${phase}-${i}`),
    posts: POSTS[phase].map((p) => `fh-peer-${p.name}`),
    pace: Array.from({ length: 5 }, (_, i) => `fh-pace-${phase}-${i}`),
  }), [phase]);

  const toggle = (f: string) => setPicked((p) => { const n = new Set(p); n.has(f) ? n.delete(f) : n.add(f); return n; });
  const toggleReaction = (id: string) => setReactions((r) => {
    const n = { ...r, [id]: !r[id] };
    storage.setItem(REACT_KEY, JSON.stringify(n));
    return n;
  });
  const share = () => {
    const p: MyPost = { note: note.trim(), feelings: [...picked], phase, at: new Date().toISOString() };
    const next = [p, ...myPosts];
    setMyPosts(next);
    storage.setItem("forher.community.v1", JSON.stringify(next));
    setShared(true); setPicked(new Set()); setNote("");
  };
  const canShare = picked.size > 0 || note.trim().length > 0;

  const accentText = { color: a.deep } as ViewStyle;

  return (
    <Screen>
      <Header title="For Her · Community" />

      <View style={styles.hero}>
        <Text style={styles.h1}>
          {logged ? "Women in your " : "Women "}
          <Text style={[styles.h1em, { color: a.deep }]}>{logged ? `${phaseWord} phase` : "like you"}</Text>
        </Text>
        <Text style={styles.sub}>Recommendations and check-ins from women tracking the same phase as you.</Text>
      </View>

      {carePlan && (
        <View style={[styles.pacing, { backgroundColor: a.soft, borderColor: a.line }]}>
          <View style={styles.pacingRow}>
            <View style={styles.pacingAvatars}>
              {avatars.pace.map((seed, i) => (
                <Avatar key={i} seed={seed} size={30} style={[styles.pacingAv, i > 0 && { marginLeft: -9 }]} />
              ))}
            </View>
            <Text style={[styles.pacingTag, accentText]}>Women in your {phaseWord} phase</Text>
          </View>
          <Text style={styles.pacingText}>{PACING[phase]}</Text>
        </View>
      )}

      {/* Feeling check-in */}
      <View style={[styles.contrib, { backgroundColor: a.soft, borderColor: a.line }]}>
        <Text style={styles.contribHead}>How are you feeling this <Text style={[styles.em, accentText]}>{phaseWord}</Text> phase?</Text>
        <View style={styles.chips}>
          {FEELINGS.map((f) => {
            const on = picked.has(f);
            return (
              <Pressable key={f} onPress={() => toggle(f)} style={[styles.chip, { borderColor: a.line }, on && { backgroundColor: a.main, borderColor: a.main }]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{f}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          style={styles.note}
          value={note}
          onChangeText={setNote}
          placeholder="Add a note to share — what helped you today? (optional)"
          placeholderTextColor={colors.textMuted}
          multiline
        />
        <Pressable onPress={share} disabled={!canShare} style={[styles.share, { backgroundColor: a.main }, !canShare && styles.shareOff]}>
          <Text style={styles.shareText}>Share with your phase community</Text>
        </Pressable>
        {shared && (
          <View style={[styles.thanks, { borderColor: a.line }]}>
            <View style={[styles.thanksIcon, { backgroundColor: a.main }]}><Check size={16} color="#fff" strokeWidth={3} /></View>
            <Text style={[styles.thanksText, accentText]}>Shared with your {phaseWord} phase community — thank you</Text>
          </View>
        )}
      </View>

      {myPosts.length > 0 && (
        <>
          <SectionTitle accent={a.main} label="Your check-ins" />
          {myPosts.map((p, i) => (
            <View key={i} style={[styles.yourCard, { borderColor: a.line, backgroundColor: a.soft }]}>
              {p.feelings.length > 0 && <Text style={[styles.yourTag, accentText]}>{p.feelings.join(" · ")}</Text>}
              {!!p.note && <Text style={styles.yourText}>“{p.note}”</Text>}
            </View>
          ))}
        </>
      )}

      {/* Peer tips */}
      <SectionTitle accent={a.main} label="What's working for women now" />
      {TIPS[phase].map((t, i) => {
        const id = `tip:${phase}:${i}`;
        return (
          <Card key={id} accent={a}>
            <View style={styles.cardTop}>
              <Avatar seed={avatars.tips[i]} size={38} />
              <View style={styles.cardWho}>
                <Text style={[styles.kind, accentText]}>{KIND_LABEL[t.kind]}</Text>
                <Text style={styles.who}>A woman in your {phaseWord} phase</Text>
              </View>
            </View>
            <Text style={styles.cardText}>{t.text}</Text>
            <ReactionPill base={t.saved} on={!!reactions[id]} onToggle={() => toggleReaction(id)} kind="save" />
          </Card>
        );
      })}

      {/* Posts */}
      <SectionTitle accent={a.main} label="Phase check-ins" />
      {POSTS[phase].map((p, i) => {
        const id = `post:${phase}:${i}`;
        return (
          <Card key={id} accent={a}>
            <View style={styles.cardTop}>
              <Avatar seed={avatars.posts[i]} size={38} />
              <View style={styles.cardWho}>
                <Text style={styles.who}>A woman in your {phaseWord} phase</Text>
                <Text style={styles.whoSub}>Checked in today</Text>
              </View>
            </View>
            <Text style={styles.cardText}>{p.text}</Text>
            <ReactionPill base={p.likes} on={!!reactions[id]} onToggle={() => toggleReaction(id)} kind="like" />
          </Card>
        );
      })}

      <Text style={styles.disclaimer}>Voices and counts shown are seeded for this preview — not live activity. Shared for general wellbeing, not medical advice.</Text>
    </Screen>
  );
}

function SectionTitle({ label, accent }: { label: string; accent: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={[styles.sectionMark, { backgroundColor: accent }]} />
      <Text style={styles.sectionText}>{label}</Text>
    </View>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent: { main: string; deep: string } }) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardBar, { backgroundColor: accent.main }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  h1: { fontSize: 25, fontFamily: fonts.serif, color: colors.plumDeep, lineHeight: 30 },
  h1em: { fontFamily: fonts.serif, fontStyle: "italic" },
  sub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 18 },
  em: { fontStyle: "italic" },

  pacing: { marginHorizontal: 18, marginBottom: 6, borderWidth: 1, borderRadius: 18, padding: 14 },
  pacingRow: { flexDirection: "row", alignItems: "center" },
  pacingAvatars: { flexDirection: "row", alignItems: "center" },
  pacingAv: { borderWidth: 2, borderColor: "#fff" },
  pacingTag: { marginLeft: 11, fontSize: 10.5, fontFamily: fonts.sansBold, textTransform: "uppercase", letterSpacing: 0.4 },
  pacingText: { marginTop: 11, fontSize: 13, fontFamily: fonts.sans, color: "#4A3A44", lineHeight: 19 },

  contrib: { marginHorizontal: 18, marginTop: 14, borderWidth: 1, borderRadius: 18, padding: 15 },
  contribHead: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.plum },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 12 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13, backgroundColor: "#fff" },
  chipText: { fontSize: 11.5, fontFamily: fonts.sansMedium, color: colors.plum },
  chipTextOn: { color: "#fff" },
  note: { minHeight: 48, borderWidth: 1, borderColor: "rgba(91,42,74,0.18)", borderRadius: 12, padding: 11, fontSize: 12, fontFamily: fonts.sans, color: colors.text, backgroundColor: "#fff", marginBottom: 10, textAlignVertical: "top" },
  share: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  shareOff: { opacity: 0.5 },
  shareText: { color: "#fff", fontSize: 12.5, fontFamily: fonts.sansBold },
  thanks: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 11, backgroundColor: "#fff", borderWidth: 1, borderRadius: 13, padding: 10 },
  thanksIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  thanksText: { flex: 1, fontSize: 12.5, fontFamily: fonts.sansBold },

  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 9, marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionMark: { width: 16, height: 2, borderRadius: 2 },
  sectionText: { fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 0.6, textTransform: "uppercase", color: colors.textMuted },

  card: { marginHorizontal: 18, marginBottom: 11, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(91,42,74,0.08)", borderRadius: 16, padding: 14, overflow: "hidden" },
  cardBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardWho: { flex: 1 },
  kind: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase" },
  who: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  whoSub: { fontSize: 10.5, fontFamily: fonts.sansMedium, color: colors.textMuted },
  cardText: { fontSize: 13, fontFamily: fonts.sans, color: colors.plumDeep, lineHeight: 20, marginTop: 10, marginBottom: 12 },

  react: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", backgroundColor: "rgba(142,83,120,0.10)", borderWidth: 1, borderColor: "rgba(142,83,120,0.30)", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  reactOn: { backgroundColor: colors.plumBright, borderColor: colors.plumBright },
  reactCount: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.plumBright },
  reactLabel: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.plumBright },
  reactTextOn: { color: "#fff" },

  yourCard: { marginHorizontal: 18, marginBottom: 10, borderWidth: 1, borderStyle: "dashed", borderRadius: 14, padding: 12 },
  yourTag: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase" },
  yourText: { fontSize: 12.5, fontFamily: fonts.sans, fontStyle: "italic", color: "#4A3A44", marginTop: 6, lineHeight: 18 },

  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginHorizontal: 22, marginTop: 20, lineHeight: 14 },
});
