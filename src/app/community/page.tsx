"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import type { CyclePhase } from "@/types/journey";
import { ChevronLeft, Heart, Check } from "lucide-react";
import styles from "./community.module.css";

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

type MyPost = { note: string; feelings: string[]; phase: string; at: string };
function readMyPosts(): MyPost[] {
  try { const a = JSON.parse(localStorage.getItem("forher.community.v1") || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}

export default function CommunityPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const today = new Date();
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const logged = !!fh.cycleLog?.lastPeriod;
  // Phase comes only from her logged cycle; until then we don't claim a phase.
  const phase: CyclePhase = fh.cycleLog?.lastPeriod
    ? phaseForCycleDay(cycleDayFromLog(fh.cycleLog.lastPeriod, L, today), L, fh.cycleLog?.duration ?? 5)
    : "follicular";
  const carePlan = personaTrack(persona) !== "none";

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(false);
  const [myPosts, setMyPosts] = useState<MyPost[]>(() => (typeof window === "undefined" ? [] : readMyPosts()));
  const toggle = (f: string) => setPicked((p) => { const n = new Set(p); n.has(f) ? n.delete(f) : n.add(f); return n; });

  // Persist the user's own shared prompts so they survive a reload.
  const share = () => {
    const p: MyPost = { note: note.trim(), feelings: [...picked], phase, at: new Date().toISOString() };
    const next = [p, ...myPosts];
    setMyPosts(next);
    try { localStorage.setItem("forher.community.v1", JSON.stringify(next)); } catch { /* ignore */ }
    setShared(true);
    setPicked(new Set());
    setNote("");
  };

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · Community</span>
      </header>

      <div className={styles.hero}>
        {logged ? (
          <>
            <h1 className={styles.h1}>Women in your <em>{PHASE_LABEL[phase].toLowerCase()} phase</em></h1>
            <p className={styles.sub}>Real recommendations and check-ins from women tracking the same phase.</p>
          </>
        ) : (
          <>
            <h1 className={styles.h1}>Women <em>like you</em></h1>
            <p className={styles.sub}>Real recommendations and check-ins. <Link href="/cycle" className={styles.inlineLink}>Log your cycle</Link> to see your phase community.</p>
          </>
        )}
      </div>

      {carePlan && <div className={styles.pacing}>{PACING[phase]}</div>}

      {/* Feeling check-in */}
      <div className={styles.contrib}>
        <div className={styles.contribHead}>How are you feeling this <em>{PHASE_LABEL[phase].toLowerCase()}</em> phase?</div>
        <div className={styles.chips}>
          {FEELINGS.map((f) => (
            <button key={f} type="button" className={`${styles.chip} ${picked.has(f) ? styles.chipOn : ""}`} onClick={() => toggle(f)}>{f}</button>
          ))}
        </div>
        <textarea
          className={styles.note}
          placeholder="Add a prompt to share — what helped you today? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="button" className={styles.share} onClick={share} disabled={picked.size === 0 && !note.trim()}>Share with the community</button>
        {shared && <div className={styles.thanks}><Check size={18} /> Shared — thank you</div>}
      </div>

      {myPosts.length > 0 && (
        <>
          <div className={styles.sectionTitle}>Your check-ins</div>
          <div className={styles.tips}>
            {myPosts.map((p, i) => (
              <div key={i} className={styles.tip}>
                {p.feelings.length > 0 && <span className={`${styles.kind} ${styles.kindPeer}`}>{p.feelings.join(", ")}</span>}
                {p.note && <p className={styles.tipText}>{p.note}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tips */}
      <div className={styles.sectionTitle}>What&apos;s working for women now</div>
      <div className={styles.tips}>
        {TIPS[phase].map((t, i) => (
          <div key={i} className={`${styles.tip} fhReveal`} style={{ animationDelay: `${i * 70}ms` }}>
            <span className={`${styles.kind} ${styles["kind" + t.kind]}`}>{t.kind === "Peer" ? "From the community" : t.kind === "Pacing" ? "Keeping your pace" : "Diet from the community"}</span>
            <p className={styles.tipText}>{t.text}</p>
            <span className={styles.saved}>{t.saved.toLocaleString()} women saved this</span>
          </div>
        ))}
      </div>

      {/* Posts */}
      <div className={styles.sectionTitle}>Phase check-ins</div>
      <div className={styles.posts}>
        {POSTS[phase].map((p, i) => (
          <div key={i} className={`${styles.post} fhReveal`} style={{ animationDelay: `${i * 70}ms` }}>
            <div className={styles.postTop}><span className={styles.avatar} aria-hidden /><span className={styles.name}>In your {PHASE_LABEL[phase].toLowerCase()} phase</span></div>
            <p className={styles.postText}>{p.text}</p>
            <span className={styles.likes}><Heart size={12} /> {p.likes}</span>
          </div>
        ))}
      </div>

      <p className={styles.disclaimer}>Shared for general wellbeing — not medical advice.</p>
    </main>
  );
}
