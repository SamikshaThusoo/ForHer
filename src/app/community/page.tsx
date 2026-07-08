"use client";
import { useState, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { avatarSvgUriFor } from "@/lib/avatar";
import type { CyclePhase } from "@/types/journey";
import { ChevronLeft, Heart, Check, Bookmark } from "lucide-react";
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

// Phase palette (task's map): menstrual rose, follicular gold, ovulation teal, luteal plum.
const PHASE_ACCENT: Record<CyclePhase, { main: string; deep: string; soft: string; line: string }> = {
  menstrual: { main: "#C76B7A", deep: "#A34E5E", soft: "rgba(199,107,122,0.10)", line: "rgba(199,107,122,0.30)" },
  follicular: { main: "#C9A24A", deep: "#997629", soft: "rgba(201,162,74,0.12)", line: "rgba(201,162,74,0.34)" },
  ovulatory: { main: "#2F7A7A", deep: "#236B6B", soft: "rgba(47,122,122,0.10)", line: "rgba(47,122,122,0.30)" },
  luteal: { main: "#8E5378", deep: "#6E3C5C", soft: "rgba(142,83,120,0.10)", line: "rgba(142,83,120,0.30)" },
};

const KIND_LABEL: Record<Tip["kind"], string> = {
  Peer: "From the community",
  Pacing: "Keeping your pace",
  Diet: "From the kitchen",
};

// Emphasise the numeric token in the pacing sentence (presentation only — text unchanged).
function withStat(text: string): ReactNode[] {
  return text.split(/([\d,]+(?:\.\d+)?)/).map((part, i) =>
    /^[\d,]+(?:\.\d+)?$/.test(part)
      ? <b key={i} className={styles.stat}>{part}</b>
      : <span key={i}>{part}</span>,
  );
}

type MyPost = { note: string; feelings: string[]; phase: string; at: string };
function readMyPosts(): MyPost[] {
  try { const a = JSON.parse(localStorage.getItem("forher.community.v1") || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
}

const REACT_KEY = "forher.community.reactions.v1";
function readReactions(): Record<string, boolean> {
  try { const o = JSON.parse(localStorage.getItem(REACT_KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch { return {}; }
}

/** A tactile reaction pill: tap → soft pop, the count ticks up, saved state holds.
 *  The pill and its resting count are plain DOM (always visible); Framer only adds
 *  the pop / ripple / tick as enhancement on top. */
function ReactionPill({ base, on, onToggle, kind, reduce }: {
  base: number; on: boolean; onToggle: () => void; kind: "save" | "like"; reduce: boolean;
}) {
  const count = base + (on ? 1 : 0);
  const Icon = kind === "save" ? Bookmark : Heart;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={kind === "save" ? (on ? "Saved" : "Save this") : (on ? "Liked" : "Like this")}
      className={`${styles.react} ${on ? styles.reactOn : ""}`}
    >
      <span className={styles.reactIconWrap}>
        <motion.span
          className={styles.reactIcon}
          animate={reduce ? undefined : (on ? { scale: [1, 1.35, 1] } : { scale: 1 })}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Icon size={14} fill={on ? "currentColor" : "none"} strokeWidth={2} />
        </motion.span>
        {on && !reduce && (
          <motion.span
            className={styles.reactRing}
            initial={{ scale: 0.4, opacity: 0.6 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            aria-hidden
          />
        )}
      </span>
      <span className={styles.reactCount}>
        {/* Keyed pop on change — no exit animation, so a stalled frame never
            strands two stacked numbers; worst case is a slightly-scaled count. */}
        <motion.span
          key={count}
          initial={reduce ? false : { scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 16 }}
        >
          {count.toLocaleString()}
        </motion.span>
      </span>
      {kind === "save" && <span className={styles.reactLabel}>{on ? "saved · women love this" : "women saved this"}</span>}
    </button>
  );
}

export default function CommunityPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const reduce = !!useReducedMotion();
  const today = new Date();
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const logged = !!fh.cycleLog?.lastPeriod;
  // Phase comes only from her logged cycle; until then we don't claim a phase.
  const phase: CyclePhase = fh.cycleLog?.lastPeriod
    ? phaseForCycleDay(cycleDayFromLog(fh.cycleLog.lastPeriod, L, today), L, fh.cycleLog?.duration ?? 5)
    : "follicular";
  const carePlan = personaTrack(persona) !== "none";
  const phaseWord = PHASE_LABEL[phase].toLowerCase();
  const a = PHASE_ACCENT[phase];
  const accentVars = { "--accent": a.main, "--accentDeep": a.deep, "--accentSoft": a.soft, "--accentLine": a.line } as CSSProperties;

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [shared, setShared] = useState(false);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [reactions, setReactions] = useState<Record<string, boolean>>({});
  const toggle = (f: string) => setPicked((p) => { const n = new Set(p); n.has(f) ? n.delete(f) : n.add(f); return n; });

  // Hydrate persisted state on mount (avoids SSR/first-paint mismatch).
  useEffect(() => { setMyPosts(readMyPosts()); setReactions(readReactions()); }, []);

  // The share confirmation is a moment, not a permanent banner.
  useEffect(() => {
    if (!shared) return;
    const t = setTimeout(() => setShared(false), 3600);
    return () => clearTimeout(t);
  }, [shared]);

  // Deterministic, seeded avatars — memoised so typing in the note doesn't rebuild them.
  const avatars = useMemo(() => ({
    tips: TIPS[phase].map((_, i) => avatarSvgUriFor(`fh-tip-${phase}-${i}`, "flat")),
    posts: POSTS[phase].map((p) => avatarSvgUriFor(`fh-peer-${p.name}`, "flat")),
    pace: Array.from({ length: 5 }, (_, i) => avatarSvgUriFor(`fh-pace-${phase}-${i}`, "flat")),
  }), [phase]);

  const toggleReaction = (id: string) => setReactions((r) => {
    const n = { ...r, [id]: !r[id] };
    try { localStorage.setItem(REACT_KEY, JSON.stringify(n)); } catch { /* ignore */ }
    return n;
  });

  const share = () => {
    const p: MyPost = { note: note.trim(), feelings: [...picked], phase, at: new Date().toISOString() };
    const next = [p, ...myPosts];
    setMyPosts(next);
    try { localStorage.setItem("forher.community.v1", JSON.stringify(next)); } catch { /* ignore */ }
    setShared(true);
    setPicked(new Set());
    setNote("");
  };

  // Entrance uses the codebase's CSS reveal (declarative → robust in background
  // tabs, disabled under reduced motion). Framer is reserved for interactions.
  const rise = (i: number): CSSProperties => (reduce ? {} : { animationDelay: `${i * 70}ms` });

  return (
    <main className={`${styles.page} fhTheme`} style={accentVars}>
      <div className={styles.glow} aria-hidden />
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · Community</span>
      </header>

      <div className={styles.hero}>
        {logged ? (
          <>
            <h1 className={styles.h1}>Women in your <em>{phaseWord} phase</em></h1>
            <p className={styles.sub}>Recommendations and check-ins from women tracking the same phase as you.</p>
          </>
        ) : (
          <>
            <h1 className={styles.h1}>Women <em>like you</em></h1>
            <p className={styles.sub}>Recommendations and check-ins. <Link href="/cycle" className={styles.inlineLink}>Log your cycle</Link> to see your phase community.</p>
          </>
        )}
      </div>

      {/* Pacing — a belonging moment, not a statistic. */}
      {carePlan && (
        <div className={`${styles.pacing} fhReveal`} style={rise(0)}>
          <div className={styles.pacingRow}>
            <div className={styles.pacingAvatars}>
              {avatars.pace.map((src, i) => (
                <img key={i} className={styles.pacingAv} src={src} alt="" aria-hidden />
              ))}
            </div>
            <span className={styles.pacingTag}>Women in your {phaseWord} phase</span>
          </div>
          <p className={styles.pacingText}>{withStat(PACING[phase])}</p>
        </div>
      )}

      {/* Feeling check-in — low-friction, playful contribution. */}
      <div className={`${styles.contrib} fhReveal`} style={rise(1)}>
        <div className={styles.contribHead}>How are you feeling this <em>{phaseWord}</em> phase?</div>
        <div className={styles.chips}>
          {FEELINGS.map((f) => {
            const on = picked.has(f);
            return (
              <motion.button
                key={f}
                type="button"
                className={`${styles.chip} ${on ? styles.chipOn : ""}`}
                onClick={() => toggle(f)}
                aria-pressed={on}
                whileTap={reduce ? undefined : { scale: 0.92 }}
                animate={reduce ? undefined : { scale: on ? 1.06 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 17 }}
              >
                {f}
              </motion.button>
            );
          })}
        </div>
        <textarea
          className={styles.note}
          placeholder="Add a note to share — what helped you today? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <motion.button
          type="button"
          className={styles.share}
          onClick={share}
          disabled={picked.size === 0 && !note.trim()}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          Share with your phase community
        </motion.button>
        {/* Confirmation renders visible immediately (no fade-from-0), so it never
            hides if an animation frame stalls. The checkmark pop is enhancement only. */}
        {shared && (
          <div className={styles.thanks}>
            <span className={styles.thanksIcon}><Check size={16} strokeWidth={3} /></span>
            Shared with your {phaseWord} phase community — thank you
          </div>
        )}
      </div>

      {myPosts.length > 0 && (
        <>
          <div className={styles.sectionTitle}>Your check-ins</div>
          <div className={styles.feed}>
            {myPosts.map((p, i) => (
              <div key={i} className={styles.yourCard}>
                {p.feelings.length > 0 && <span className={styles.yourTag}>{p.feelings.join(" · ")}</span>}
                {p.note && <p className={styles.yourText}>“{p.note}”</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Peer tips — warm feed with the signature save interaction. */}
      <div className={styles.sectionTitle}>What&apos;s working for women now</div>
      <div className={styles.feed}>
        {TIPS[phase].map((t, i) => {
          const id = `tip:${phase}:${i}`;
          return (
            <div key={id} className={`${styles.card} fhReveal`} style={rise(i)}>
              <div className={styles.cardTop}>
                <img className={styles.av} src={avatars.tips[i]} alt="" aria-hidden />
                <div className={styles.cardWho}>
                  <span className={styles.kind}>{KIND_LABEL[t.kind]}</span>
                  <span className={styles.who}>A woman in your {phaseWord} phase</span>
                </div>
              </div>
              <p className={styles.cardText}>{t.text}</p>
              <div className={styles.cardFoot}>
                <ReactionPill base={t.saved} on={!!reactions[id]} onToggle={() => toggleReaction(id)} kind="save" reduce={reduce} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase check-ins — first-person voices, anonymised. */}
      <div className={styles.sectionTitle}>Phase check-ins</div>
      <div className={styles.feed}>
        {POSTS[phase].map((p, i) => {
          const id = `post:${phase}:${i}`;
          return (
            <div key={id} className={`${styles.card} fhReveal`} style={rise(i)}>
              <div className={styles.cardTop}>
                <img className={styles.av} src={avatars.posts[i]} alt="" aria-hidden />
                <div className={styles.cardWho}>
                  <span className={styles.who}>A woman in your {phaseWord} phase</span>
                  <span className={styles.whoSub}>Checked in today</span>
                </div>
              </div>
              <p className={styles.cardText}>{p.text}</p>
              <div className={styles.cardFoot}>
                <ReactionPill base={p.likes} on={!!reactions[id]} onToggle={() => toggleReaction(id)} kind="like" reduce={reduce} />
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.disclaimer}>Voices and counts shown are seeded for this preview — not live activity. Shared for general wellbeing, not medical advice.</p>
    </main>
  );
}
