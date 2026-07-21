import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, type TextStyle } from "react-native";
import { useRouter } from "expo-router";
import { Bookmark, Heart, Check, Flame, Pencil } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { Avatar } from "@/components/ui/Avatar";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { storage } from "@/lib/storage";
import { colors, fonts, phaseAccent } from "@/theme/tokens";
import type { CyclePhase } from "@/types/journey";

const FEELINGS = ["Energetic", "Calm", "Motivated", "Tired", "Crampy", "Bloated", "Moody", "Anxious"];

const TRENDING_TOPICS = [
  {
    tag: "Pre-menopausal",
    title: "Navigating the transition",
    desc: "Irregular cycles, hot flashes, sleep changes — how women are managing the approach to menopause.",
    posts: [
      { name: "Sunita", text: "My cycles are 22 days one month, 45 the next. Finally talked to my doctor. Turns out perimenopause can start in your 40s." },
      { name: "Rekha", text: "The night sweats woke me every hour for weeks. Magnesium glycinate at bedtime changed everything." },
      { name: "Meera", text: "Mood swings I never had before. Knowing it's hormonal makes it easier to manage — less self-blame." },
    ],
  },
  {
    tag: "Period pain",
    title: "Making period pain manageable",
    desc: "What's worked for cramping — from diet tweaks to heat therapy to knowing when to see a doctor.",
    posts: [
      { name: "Anjali", text: "Cutting refined sugar the week before completely changed my cramp severity. Worth trying for one cycle." },
      { name: "Priya", text: "I used to push through pain at work. Getting a diagnosis (mild endo) and actual treatment was the answer." },
      { name: "Divya", text: "Hot water bag + a ginger-turmeric chai. I know it sounds old-fashioned but it genuinely helps." },
    ],
  },
  {
    tag: "Endometriosis",
    title: "Living with endometriosis",
    desc: "Women sharing what a diagnosis changed, and how they manage flare-ups day to day.",
    posts: [
      { name: "Kiran", text: "7 years before I got diagnosed. If your pain is being dismissed, keep pushing for a second opinion." },
      { name: "Nisha", text: "Low-inflammatory diet isn't a cure, but it made flare-ups noticeably less frequent for me." },
      { name: "Shalini", text: "Tracking symptoms in an app helped me show my doctor a pattern. Took one appointment to finally get scanned." },
    ],
  },
  {
    tag: "Hormonal acne",
    title: "Skin that changes with your cycle",
    desc: "Understanding jaw-line breakouts, oily phases and what actually helps.",
    posts: [
      { name: "Tara", text: "Breakouts only in the week before my period — turns out that's textbook progesterone acne. Now I adjust my routine." },
      { name: "Rhea", text: "Spearmint tea every morning for 3 months and my chin acne reduced by half. Small but real." },
      { name: "Pallavi", text: "Finally saw a dermatologist who looked at my cycle history. A targeted retinoid made the biggest difference." },
    ],
  },
  {
    tag: "PMOS / PCOS",
    title: "Managing PMOS day to day",
    desc: "Practical habits for blood sugar, mood and irregular cycles — from women already on this path.",
    posts: [
      { name: "Ananya", text: "Eating protein first at every meal — sounds small, but it broke my afternoon energy crash pattern." },
      { name: "Sanya", text: "Resistance training twice a week improved my insulin sensitivity more than any supplement I tried." },
      { name: "Kavya", text: "Getting diagnosed late (at 29) was frustrating. But now I understand my body way better." },
    ],
  },
  {
    tag: "Fertility",
    title: "Understanding your fertility window",
    desc: "Tracking ovulation, what cycle tracking reveals, and conversations about TTC.",
    posts: [
      { name: "Nandini", text: "BBT tracking for 3 months showed me I was ovulating much later than typical apps assumed. Cycle tracking is personal." },
      { name: "Gayatri", text: "We spent a year 'trying' before realising we were timing it wrong. Understanding the window changed everything." },
      { name: "Leena", text: "PMOS made predicting ovulation hard. Ovulation strips + cycle tracking together gave me a clearer picture." },
    ],
  },
  {
    tag: "Stress & cycle",
    title: "When stress shifts your cycle",
    desc: "Late periods, missed cycles and heavier bleeding — how stress shows up in your hormones.",
    posts: [
      { name: "Aditi", text: "I skipped a period entirely during my exam month. My gynaecologist said cortisol suppresses ovulation. Made sense." },
      { name: "Simran", text: "Breathwork for 10 minutes before bed — my luteal phase symptoms were visibly less severe the next cycle." },
      { name: "Rina", text: "A job change made my cycles 40+ days for three months. Stress is real, hormones listen." },
    ],
  },
];

/** Returns today's trending topic — rotates every day. */
function todaysTopic() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return TRENDING_TOPICS[dayOfYear % TRENDING_TOPICS.length];
}

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

// Seeded daily pulse per phase: who's here, the dominant feeling, one pacing stat.
const PULSE: Record<CyclePhase, { checkedIn: number; feeling: string; emoji: string; stat: string }> = {
  menstrual: { checkedIn: 168, feeling: "Tired", emoji: "🌙", stat: "~5,200 steps on average — gentler is normal." },
  follicular: { checkedIn: 214, feeling: "Energetic", emoji: "⚡", stat: "~7,800 steps on average this week." },
  ovulatory: { checkedIn: 189, feeling: "Motivated", emoji: "🔥", stat: "2.4 strength sessions a week — the most of any phase." },
  luteal: { checkedIn: 203, feeling: "Moody", emoji: "🌫️", stat: "~6,100 steps on average — easing off is common." },
};

const KIND_LABEL: Record<Tip["kind"], string> = {
  Peer: "From the community",
  Pacing: "Keeping your pace",
  Diet: "From the kitchen",
};

/** Emphasise the numeric token in the pacing sentence (e.g. "~7,800"). */
function withStat(text: string, color: string) {
  return text.split(/([\d,]+(?:\.\d+)?)/).map((part, i) =>
    /^[\d,]+(?:\.\d+)?$/.test(part)
      ? <Text key={i} style={{ fontFamily: fonts.sansBold, color }}>{part}</Text>
      : <Text key={i}>{part}</Text>,
  );
}

const REACT_KEY = "forher.community.reactions.v1";
const readReactions = (): Record<string, boolean> => {
  try { const o = JSON.parse(storage.getItem(REACT_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch { return {}; }
};

type MyPost = { note: string; feelings: string[]; phase: string; at: string };
const readMyPosts = (): MyPost[] => {
  try { const a = JSON.parse(storage.getItem("forher.community.v1") || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
};

// User stories logged into trending topics, keyed by topic tag.
const STORIES_KEY = "forher.community.stories.v1";
const readMyStories = (): Record<string, string[]> => {
  try { const o = JSON.parse(storage.getItem(STORIES_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch { return {}; }
};

function ReactionPill({ base, on, onToggle, kind }: { base: number; on: boolean; onToggle: () => void; kind: "save" | "like" }) {
  const count = base + (on ? 1 : 0);
  const Icon = kind === "save" ? Bookmark : Heart;
  return (
    <PressableScale onPress={onToggle} style={[styles.react, on && styles.reactOn]} accessibilityRole="button">
      <Icon size={14} color={on ? "#fff" : colors.plumBright} fill={on ? "#fff" : "none"} strokeWidth={2} />
      <Text style={[styles.reactCount, on && styles.reactTextOn]}>{count.toLocaleString()}</Text>
      {kind === "save" && <Text style={[styles.reactLabel, on && styles.reactTextOn]}>{on ? "saved" : "saved this"}</Text>}
    </PressableScale>
  );
}

export default function Community() {
  const router = useRouter();
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const today = new Date();
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const logged = !!fh.cycleLog?.lastPeriod;
  const phase: CyclePhase = fh.cycleLog?.lastPeriod
    ? phaseForCycleDay(cycleDayFromLog(fh.cycleLog.lastPeriod, L, today), L, fh.cycleLog?.duration ?? 5)
    : "follicular";
  const phaseWord = PHASE_LABEL[phase].toLowerCase();
  const a = phaseAccent[phase];
  const pulse = PULSE[phase];

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(false);
  const [editing, setEditing] = useState(false);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [reactions, setReactions] = useState<Record<string, boolean>>({});
  const [myStories, setMyStories] = useState<Record<string, string[]>>({});
  const [storyDraft, setStoryDraft] = useState("");
  const [topicOpen, setTopicOpen] = useState(false);

  useEffect(() => { setMyPosts(readMyPosts()); setReactions(readReactions()); setMyStories(readMyStories()); }, []);
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
    setShared(true); setPicked(new Set()); setNote(""); setEditing(false);
  };
  const canShare = picked.size > 0 || note.trim().length > 0;

  const topic = todaysTopic();
  const topicStories = myStories[topic.tag] ?? [];
  const postStory = () => {
    const text = storyDraft.trim();
    if (!text) return;
    const next = { ...myStories, [topic.tag]: [text, ...topicStories] };
    setMyStories(next);
    storage.setItem(STORIES_KEY, JSON.stringify(next));
    setStoryDraft("");
  };

  const lastPost = myPosts[0];
  const checkedToday = !!lastPost && new Date(lastPost.at).toDateString() === today.toDateString();

  // One feed: tips and check-ins interleaved, context set once by the section title.
  type FeedItem = { id: string; avatar: string; tag: string; text: string; base: number; kind: "save" | "like" };
  const feed = useMemo(() => {
    const tips: FeedItem[] = TIPS[phase].map((t, i) => ({
      id: `tip:${phase}:${i}`, avatar: avatars.tips[i], tag: KIND_LABEL[t.kind],
      text: t.text, base: t.saved, kind: "save",
    }));
    const posts: FeedItem[] = POSTS[phase].map((p, i) => ({
      id: `post:${phase}:${i}`, avatar: avatars.posts[i], tag: "Checked in today",
      text: p.text, base: p.likes, kind: "like",
    }));
    const out: FeedItem[] = [];
    const n = Math.max(tips.length, posts.length);
    for (let i = 0; i < n; i++) {
      if (tips[i]) out.push(tips[i]);
      if (posts[i]) out.push(posts[i]);
    }
    return out;
  }, [phase, avatars]);

  const accentText: TextStyle = { color: a.deep };

  return (
    <Screen>
      <Header title="For Her · Community" />

      {/* ── Hero + today's pulse, one glanceable block ── */}
      <View style={styles.hero}>
        <Text style={styles.h1}>
          {logged ? "Women in your " : "Women "}
          <Text style={[styles.h1em, { color: a.deep }]}>{logged ? `${phaseWord} phase` : "like you"}</Text>
        </Text>
        {!logged && (
          <Text style={styles.sub}><Text style={[styles.sub, styles.inlineLink]} onPress={() => router.push("/cycle")}>Log your cycle</Text> to see your phase community.</Text>
        )}
      </View>

      <View style={[styles.pulse, { backgroundColor: a.soft, borderColor: a.line }]}>
        <View style={styles.pulseRow}>
          <View style={styles.pulseAvatars}>
            {avatars.pace.map((seed, i) => (
              <Avatar key={i} seed={seed} size={30} style={[styles.pulseAv, i > 0 && { marginLeft: -9 }]} />
            ))}
          </View>
          <View style={styles.pulseBody}>
            <Text style={[styles.pulseTop, accentText]}>{pulse.checkedIn} checked in today</Text>
            <Text style={styles.pulseSub}>Top feeling: <Text style={[styles.pulseFeel, accentText]}>{pulse.feeling} {pulse.emoji}</Text></Text>
          </View>
        </View>
        <Text style={styles.pulseStat}>{withStat(pulse.stat, a.deep)}</Text>
      </View>

      {/* ── Trending today: collapsed teaser, expandable, and you can add yours ── */}
      <View style={styles.trendCard}>
        <PressableScale onPress={() => setTopicOpen((o) => !o)}>
          <View style={styles.trendHead}>
            <View style={styles.trendFlame}><Flame size={14} color="#C9622A" /></View>
            <View style={styles.trendMeta}>
              <Text style={styles.trendTag}>Trending today · {topic.tag}</Text>
              <Text style={styles.trendTitle}>{topic.title}</Text>
            </View>
          </View>
          <Text style={styles.trendDesc}>{topic.desc}</Text>
        </PressableScale>

        {topicOpen && (
          <View style={styles.trendPosts}>
            {topicStories.map((text, i) => (
              <View key={`mine-${i}`} style={[styles.trendPost, styles.trendPostMine]}>
                <Avatar seed={`you-${persona.id}`} size={30} />
                <View style={styles.trendPostBody}>
                  <Text style={styles.trendPostName}>You</Text>
                  <Text style={styles.trendPostText}>{text}</Text>
                </View>
              </View>
            ))}
            {topic.posts.map((p, i) => (
              <View key={i} style={styles.trendPost}>
                <Avatar seed={`trend-${topic.tag}-${i}`} size={30} />
                <View style={styles.trendPostBody}>
                  <Text style={styles.trendPostName}>{p.name}</Text>
                  <Text style={styles.trendPostText}>{p.text}</Text>
                </View>
              </View>
            ))}
            <View style={styles.trendComposer}>
              <TextInput
                style={styles.trendInput}
                value={storyDraft}
                onChangeText={setStoryDraft}
                placeholder="Been through this? Share your experience…"
                placeholderTextColor="#A08060"
                multiline
              />
              <PressableScale onPress={postStory} disabled={!storyDraft.trim()} style={[styles.trendPostBtn, !storyDraft.trim() && styles.shareOff]}>
                <Text style={styles.trendPostBtnText}>Post</Text>
              </PressableScale>
            </View>
          </View>
        )}

        <PressableScale onPress={() => setTopicOpen((o) => !o)}>
          <Text style={styles.trendToggle}>
            {topicOpen ? "Show less ▲" : `Read ${topic.posts.length + topicStories.length} stories · add yours ▼`}
          </Text>
        </PressableScale>
      </View>

      {/* ── Your check-in: full composer until you've checked in today, then compact ── */}
      {checkedToday && !editing ? (
        <View style={[styles.doneCard, { borderColor: a.line, backgroundColor: a.soft }]}>
          <View style={[styles.thanksIcon, { backgroundColor: a.main }]}><Check size={16} color="#fff" strokeWidth={3} /></View>
          <View style={styles.doneBody}>
            <Text style={[styles.doneTitle, accentText]}>Checked in today{lastPost.feelings.length > 0 ? ` · ${lastPost.feelings.join(", ")}` : ""}</Text>
            {!!lastPost.note && <Text style={styles.doneNote}>“{lastPost.note}”</Text>}
          </View>
          <PressableScale onPress={() => setEditing(true)} style={styles.doneEdit}>
            <Pencil size={13} color={colors.plumBright} />
          </PressableScale>
        </View>
      ) : (
        <View style={[styles.contrib, { backgroundColor: a.soft, borderColor: a.line }]}>
          <Text style={styles.contribHead}>How are you feeling this <Text style={[styles.em, accentText]}>{phaseWord}</Text> phase?</Text>
          <View style={styles.chips}>
            {FEELINGS.map((f) => {
              const on = picked.has(f);
              return (
                <PressableScale key={f} onPress={() => toggle(f)} style={[styles.chip, { borderColor: a.line }, on && { backgroundColor: a.main, borderColor: a.main }]}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{f}</Text>
                </PressableScale>
              );
            })}
          </View>
          <TextInput
            style={styles.note}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note — what helped you today? (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <PressableScale onPress={share} disabled={!canShare} style={[styles.share, { backgroundColor: a.main }, !canShare && styles.shareOff]}>
            <Text style={styles.shareText}>Share with your phase community</Text>
          </PressableScale>
          {shared && (
            <View style={[styles.thanks, { borderColor: a.line }]}>
              <View style={[styles.thanksIcon, { backgroundColor: a.main }]}><Check size={16} color="#fff" strokeWidth={3} /></View>
              <Text style={[styles.thanksText, accentText]}>Shared with your {phaseWord} phase community — thank you</Text>
            </View>
          )}
        </View>
      )}

      {/* ── One feed: tips + check-ins from women in your phase ── */}
      <SectionTitle accent={a.main} label={`From women in your ${phaseWord} phase`} />
      {feed.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={[styles.cardBar, { backgroundColor: a.main }]} />
          <View style={styles.cardTop}>
            <Avatar seed={item.avatar} size={34} />
            <Text style={[styles.kind, accentText]}>{item.tag}</Text>
          </View>
          <Text style={styles.cardText}>{item.text}</Text>
          <ReactionPill base={item.base} on={!!reactions[item.id]} onToggle={() => toggleReaction(item.id)} kind={item.kind} />
        </View>
      ))}

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

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  h1: { fontSize: 25, fontFamily: fonts.serif, color: colors.plumDeep, lineHeight: 30 },
  h1em: { fontFamily: fonts.serif, fontStyle: "italic" },
  sub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 18 },
  inlineLink: { fontFamily: fonts.sansBold, color: colors.plumBright, textDecorationLine: "underline" },
  em: { fontStyle: "italic" },

  pulse: { marginHorizontal: 18, marginBottom: 12, borderWidth: 1, borderRadius: 18, padding: 14 },
  pulseRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  pulseAvatars: { flexDirection: "row", alignItems: "center" },
  pulseAv: { borderWidth: 2, borderColor: "#fff" },
  pulseBody: { flex: 1 },
  pulseTop: { fontSize: 13.5, fontFamily: fonts.sansBold },
  pulseSub: { fontSize: 11.5, fontFamily: fonts.sans, color: "#4A3A44", marginTop: 1 },
  pulseFeel: { fontFamily: fonts.sansBold },
  pulseStat: { marginTop: 9, fontSize: 12, fontFamily: fonts.sans, color: "#4A3A44", lineHeight: 17 },

  contrib: { marginHorizontal: 18, borderWidth: 1, borderRadius: 18, padding: 15 },
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

  doneCard: { flexDirection: "row", alignItems: "center", gap: 11, marginHorizontal: 18, borderWidth: 1, borderRadius: 16, padding: 13 },
  doneBody: { flex: 1 },
  doneTitle: { fontSize: 13, fontFamily: fonts.sansBold },
  doneNote: { fontSize: 12, fontFamily: fonts.sans, fontStyle: "italic", color: "#4A3A44", marginTop: 3, lineHeight: 17 },
  doneEdit: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },

  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 9, marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionMark: { width: 16, height: 2, borderRadius: 2 },
  sectionText: { fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 0.6, textTransform: "uppercase", color: colors.textMuted },

  card: { marginHorizontal: 18, marginBottom: 11, backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(91,42,74,0.08)", borderRadius: 16, padding: 14, overflow: "hidden" },
  cardBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  kind: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase" },
  cardText: { fontSize: 13, fontFamily: fonts.sans, color: colors.plumDeep, lineHeight: 20, marginTop: 9, marginBottom: 11 },

  react: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", backgroundColor: "rgba(142,83,120,0.10)", borderWidth: 1, borderColor: "rgba(142,83,120,0.30)", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  reactOn: { backgroundColor: colors.plumBright, borderColor: colors.plumBright },
  reactCount: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.plumBright },
  reactLabel: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.plumBright },
  reactTextOn: { color: "#fff" },

  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginHorizontal: 22, marginTop: 20, lineHeight: 14 },

  trendCard: { marginHorizontal: 18, marginBottom: 14, backgroundColor: "#FFF8F4", borderWidth: 1, borderColor: "rgba(201,98,42,0.2)", borderRadius: 18, padding: 14, gap: 8 },
  trendHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  trendFlame: { width: 30, height: 30, borderRadius: 10, backgroundColor: "rgba(201,98,42,0.12)", alignItems: "center", justifyContent: "center" },
  trendMeta: { flex: 1 },
  trendTag: { fontSize: 9.5, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: "#C9622A" },
  trendTitle: { fontSize: 14.5, fontFamily: fonts.sansBold, color: "#3E2010", marginTop: 2 },
  trendDesc: { fontSize: 12, fontFamily: fonts.sans, color: "#5A3820", lineHeight: 17, marginTop: 8 },
  trendPosts: { gap: 10, marginTop: 4 },
  trendPost: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: "#fff", borderRadius: 13, padding: 10, borderWidth: 1, borderColor: "rgba(201,98,42,0.1)" },
  trendPostMine: { borderColor: "rgba(201,98,42,0.4)", borderWidth: 1.5 },
  trendPostBody: { flex: 1 },
  trendPostName: { fontSize: 11.5, fontFamily: fonts.sansBold, color: "#3E2010" },
  trendPostText: { fontSize: 12, fontFamily: fonts.sans, color: "#5A3820", marginTop: 3, lineHeight: 17 },
  trendComposer: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  trendInput: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: "rgba(201,98,42,0.25)", borderRadius: 12, padding: 10, fontSize: 12, fontFamily: fonts.sans, color: "#3E2010", backgroundColor: "#fff", textAlignVertical: "top" },
  trendPostBtn: { backgroundColor: "#C9622A", borderRadius: 12, paddingVertical: 11, paddingHorizontal: 16 },
  trendPostBtnText: { color: "#fff", fontSize: 12, fontFamily: fonts.sansBold },
  trendToggle: { fontSize: 11, fontFamily: fonts.sansBold, color: "#C9622A", textAlign: "center", marginTop: 2 },
});
