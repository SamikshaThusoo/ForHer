import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Check, Lock, ChevronDown, Sprout, Search, Mic, Square, Camera, PenLine, Sparkles,
  CheckCircle2, Circle, AlertTriangle, Ban, ArrowRightLeft, type LucideIcon,
} from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { logMeal, logText, logPrescribed, onPlanMealsThisWeek, type MealType } from "@/lib/forher/foodlog";
import { mealPlanUnlocked, prescribedFor } from "@/lib/forher/mealplan";
import { verdictFor } from "@/lib/personalize";
import { useVoice } from "@/lib/useVoice";
import { FOODS } from "@/data/foods";
import type { Verdict } from "@/types/food";
import { colors, fonts } from "@/theme/tokens";

type LogMode = "photo" | "write" | "voice" | "manual";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const MODES: { id: LogMode; label: string; Icon: LucideIcon }[] = [
  { id: "photo", label: "Photo", Icon: Camera },
  { id: "write", label: "Write", Icon: PenLine },
  { id: "voice", label: "Voice", Icon: Mic },
  { id: "manual", label: "Search", Icon: Search },
];

const TONE: Record<Verdict["forYou"], { band: string; label: string; Icon: LucideIcon }> = {
  great: { band: "#2EAE6B", label: "Great for you", Icon: CheckCircle2 },
  ok: { band: "#F2A024", label: "OK for you", Icon: Circle },
  watch: { band: "#F67F1B", label: "Watch this", Icon: AlertTriangle },
  avoid: { band: "#E24B4A", label: "Better to avoid", Icon: Ban },
};

export default function Food() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: string }>();
  const meal: MealType = params.meal === "lunch" || params.meal === "dinner" ? params.meal : "breakfast";
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const unlocked = mealPlanUnlocked(persona, fh.day);

  const [mode, setMode] = useState<LogMode>("photo");
  const [lastFoodId, setLastFoodId] = useState<string | null>(null);
  const [showElse, setShowElse] = useState(false);
  const [weekCount, setWeekCount] = useState(0);
  useEffect(() => { setWeekCount(onPlanMealsThisWeek()); }, []);

  const lastFood = lastFoodId ? FOODS.find((f) => f.id === lastFoodId) : null;
  const verdict = lastFood ? verdictFor(lastFood, persona) : null;

  const done = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const savePrescribed = (name: string) => { logPrescribed(meal, name); done(); };
  const logIdentified = () => { if (lastFood) { logMeal(meal, lastFood.id, lastFood.name); done(); } };

  const logger = (
    <View>
      <View style={styles.tabs}>
        {MODES.map((m) => {
          const on = m.id === mode;
          return (
            <PressableScale key={m.id} onPress={() => { setMode(m.id); setLastFoodId(null); }} style={[styles.tab, on && styles.tabOn]}>
              <m.Icon size={16} strokeWidth={on ? 2.25 : 1.75} color={on ? "#fff" : colors.textSoft} />
              <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{m.label}</Text>
            </PressableScale>
          );
        })}
      </View>

      <View style={styles.modeBody}>
        {mode === "photo" && <PhotoMode onLog={setLastFoodId} />}
        {mode === "write" && <WriteMode meal={meal} onSaved={done} />}
        {mode === "voice" && <VoiceMode meal={meal} onSaved={done} />}
        {mode === "manual" && <ManualMode onLog={setLastFoodId} />}
      </View>

      {lastFood && verdict && (
        <>
          <VerdictCard verdict={verdict} foodName={lastFood.name} />
          <PressableScale onPress={logIdentified} style={styles.logCta}>
            <Check size={16} color="#fff" /><Text style={styles.logCtaText}>Log {meal} · {lastFood.name}</Text>
          </PressableScale>
        </>
      )}
    </View>
  );

  return (
    <Screen>
      <Header title="For Her · Food" />
      <View style={styles.hero}><Text style={styles.h1}>Log {cap(meal)}</Text></View>

      {unlocked ? (
        <>
          <Text style={styles.sub}>Pick from your dietician&apos;s plan — or log something else.</Text>
          <View style={styles.planWrap}>
            <Text style={styles.eyebrow}>From your dietician&apos;s plan</Text>
            <Text style={styles.planTitle}>Options for {cap(meal)}</Text>
            {prescribedFor(meal).map((o) => (
              <PressableScale key={o.name} onPress={() => savePrescribed(o.name)} style={styles.optionCard}>
                <View style={styles.optionMain}>
                  <Text style={styles.optionName}>{o.name}</Text>
                  <Text style={styles.optionNote}>{o.note}</Text>
                </View>
                <View style={styles.optionDot} />
              </PressableScale>
            ))}
            {weekCount > 0 && (
              <View style={styles.soft}>
                <Sprout size={13} color={colors.textSoft} />
                <Text style={styles.softText}>{weekCount} plan meal{weekCount > 1 ? "s" : ""} logged this week</Text>
              </View>
            )}
          </View>

          <PressableScale onPress={() => setShowElse((s) => !s)} style={styles.elseToggle}>
            <Text style={styles.elseText}>I ate something else</Text>
            <ChevronDown size={16} color={colors.textSoft} style={{ transform: [{ rotate: showElse ? "180deg" : "0deg" }] }} />
          </PressableScale>
          {showElse && logger}
        </>
      ) : (
        <>
          <Text style={styles.sub}>4 ways to log. Pick what&apos;s fastest right now.</Text>
          <View style={styles.unlockHint}>
            <Lock size={15} color={colors.plumBright} />
            <Text style={styles.unlockText}>Your meal plan unlocks after your dietician consult.</Text>
          </View>
          {logger}
        </>
      )}
    </Screen>
  );
}

function PhotoMode({ onLog }: { onLog: (id: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [rec, setRec] = useState<{ id: string; name: string; hint?: string } | null>(null);
  const capture = () => {
    setScanning(true);
    setTimeout(() => {
      const c = FOODS[Math.floor(Math.random() * FOODS.length)];
      setRec({ id: c.id, name: c.name, hint: c.imageHint });
      setScanning(false);
    }, 900);
  };
  if (rec) {
    return (
      <View style={styles.confirm}>
        <View style={styles.preview}><Text style={styles.previewEmoji}>{rec.hint ?? "🍽"}</Text></View>
        <View style={styles.confirmBody}>
          <Text style={styles.detected}>Detected</Text>
          <Text style={styles.detectedName}>{rec.name}</Text>
          <View style={styles.confirmRow}>
            <PressableScale onPress={() => setRec(null)} style={styles.secondaryBtn}><Text style={styles.secondaryText}>Retake</Text></PressableScale>
            <PressableScale onPress={() => onLog(rec.id)} style={styles.primaryBtn}><Text style={styles.primaryText}>Looks right</Text></PressableScale>
          </View>
        </View>
      </View>
    );
  }
  return (
    <PressableScale onPress={capture} disabled={scanning} style={styles.capture}>
      {scanning ? <Sparkles size={54} strokeWidth={1.4} color="rgba(255,255,255,0.9)" /> : <Camera size={54} strokeWidth={1.4} color="rgba(255,255,255,0.9)" />}
      <Text style={styles.captureText}>{scanning ? "Recognising…" : "Tap to capture your meal."}</Text>
    </PressableScale>
  );
}

function MealField({ value, onChange, placeholder, onSave, saveLabel, voice, interim }: {
  value: string; onChange: (t: string) => void; placeholder: string; onSave: () => void; saveLabel: string;
  voice?: { supported: boolean; listening: boolean; start: () => void; stop: () => void }; interim?: string;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.fieldHead}>
        <Text style={styles.fieldLabel}>What did you eat?</Text>
        {voice?.supported && (
          <PressableScale onPress={() => (voice.listening ? voice.stop() : voice.start())} style={[styles.mic, voice.listening && styles.micOn]}>
            {voice.listening ? <Square size={14} color="#fff" /> : <Mic size={15} color={colors.plumBright} />}
            <Text style={[styles.micText, voice.listening && styles.micTextOn]}>{voice.listening ? "Stop" : "Speak"}</Text>
          </PressableScale>
        )}
      </View>
      <TextInput style={styles.field} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted} multiline />
      {voice?.listening && <Text style={styles.interim}>{interim ? `“${interim}”` : "Listening… say what you ate"}</Text>}
      <PressableScale onPress={onSave} disabled={!value.trim()} style={[styles.save, !value.trim() && styles.saveOff]}>
        <Text style={styles.saveText}>{saveLabel}</Text>
      </PressableScale>
    </View>
  );
}

function WriteMode({ meal, onSaved }: { meal: MealType; onSaved: () => void }) {
  const [text, setText] = useState("");
  return <MealField value={text} onChange={setText} placeholder="Type what you ate — e.g. two rotis, dal and a bowl of curd"
    onSave={() => { if (text.trim()) { logText(meal, text, "typed"); onSaved(); } }} saveLabel={`Save ${meal}`} />;
}

function VoiceMode({ meal, onSaved }: { meal: MealType; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const voice = useVoice((fin) => setText((t) => (t.trim() ? t.trim() + " " : "") + fin), setInterim);
  return <MealField value={text} onChange={setText} placeholder="Speak or type what you ate" voice={voice} interim={interim}
    onSave={() => { if (text.trim()) { logText(meal, text, "voice"); onSaved(); } }} saveLabel={`Save ${meal}`} />;
}

function ManualMode({ onLog }: { onLog: (id: string) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => FOODS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10), [q]);
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.searchWrap}>
        <Search size={15} color={colors.textMuted} />
        <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Search Indian foods…" placeholderTextColor={colors.textMuted} />
      </View>
      {results.map((f) => (
        <PressableScale key={f.id} onPress={() => onLog(f.id)} style={styles.result}>
          <Text style={styles.resultEmoji}>{f.imageHint ?? "🍽"}</Text>
          <Text style={styles.resultName}>{f.name}</Text>
          <Text style={styles.resultKcal}>{f.per100g.energyKcal} kcal · 100g</Text>
        </PressableScale>
      ))}
    </View>
  );
}

function VerdictCard({ verdict, foodName }: { verdict: Verdict; foodName: string }) {
  const t = TONE[verdict.forYou];
  return (
    <View style={styles.verdict}>
      <View style={[styles.toneBand, { backgroundColor: t.band }]}>
        <t.Icon size={14} strokeWidth={2.25} color="#fff" />
        <Text style={styles.toneLabel}>{t.label.toUpperCase()}</Text>
      </View>
      <View style={styles.verdictBody}>
        <Text style={styles.verdictFood}>{foodName}</Text>
        <Text style={styles.verdictReason}>{verdict.oneLineReason}</Text>
        {verdict.swap && (
          <View style={styles.swap}>
            <View style={styles.swapHead}><ArrowRightLeft size={12} strokeWidth={2.25} color={colors.plumBright} /><Text style={styles.swapHeadText}>Try instead</Text></View>
            <Text style={styles.swapText}>{verdict.swap.name}</Text>
            <Text style={styles.swapWhy}>{verdict.swap.reason}</Text>
          </View>
        )}
        <Text style={styles.verdictDetail}>{verdict.detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4 },
  h1: { fontSize: 27, fontFamily: fonts.serif, color: colors.plumDeep },
  sub: { fontSize: 13.5, fontFamily: fonts.sans, color: colors.textSoft, paddingHorizontal: 18, marginTop: 4 },

  planWrap: { paddingHorizontal: 18, marginTop: 12 },
  eyebrow: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright },
  planTitle: { fontSize: 18, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 3, marginBottom: 10 },
  optionCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 13, marginBottom: 9 },
  optionMain: { flex: 1 },
  optionName: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  optionNote: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 3 },
  optionDot: { width: 15, height: 15, borderRadius: 8, borderWidth: 2, borderColor: "rgba(142,83,120,0.35)" },
  soft: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  softText: { fontSize: 11.5, fontFamily: fonts.sansMedium, color: colors.textSoft },

  elseToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 18, marginTop: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line },
  elseText: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.textSoft },

  unlockHint: { flexDirection: "row", alignItems: "center", gap: 9, marginHorizontal: 18, marginTop: 12, backgroundColor: "rgba(142,83,120,0.07)", borderWidth: 1, borderColor: "rgba(142,83,120,0.2)", borderRadius: 13, padding: 11 },
  unlockText: { flex: 1, fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.textSoft },

  tabs: { flexDirection: "row", gap: 7, paddingHorizontal: 16, paddingTop: 12 },
  tab: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, backgroundColor: "rgba(91,42,74,0.05)" },
  tabOn: { backgroundColor: colors.plum },
  tabLabel: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.textSoft },
  tabLabelOn: { color: "#fff", fontFamily: fonts.sansBold },
  modeBody: { paddingHorizontal: 18, marginTop: 14 },

  capture: { alignItems: "center", justifyContent: "center", gap: 12, height: 190, borderRadius: 20, backgroundColor: colors.plum },
  captureText: { fontSize: 13.5, fontFamily: fonts.sansMedium, color: "rgba(255,255,255,0.92)" },
  confirm: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 14 },
  preview: { width: 72, height: 72, borderRadius: 16, backgroundColor: colors.plumSoft, alignItems: "center", justifyContent: "center" },
  previewEmoji: { fontSize: 38 },
  confirmBody: { flex: 1 },
  detected: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.textMuted },
  detectedName: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 2 },
  confirmRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  secondaryBtn: { borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  secondaryText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: colors.plum },
  primaryBtn: { flex: 1, backgroundColor: colors.plum, borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  primaryText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: "#fff" },

  fieldHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fieldLabel: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.textSoft },
  mic: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(142,83,120,0.3)", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11, backgroundColor: "rgba(142,83,120,0.08)" },
  micOn: { backgroundColor: colors.plumBright, borderColor: colors.plumBright },
  micText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.plumBright },
  micTextOn: { color: "#fff" },
  interim: { fontSize: 12.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textSoft, marginTop: -2 },
  field: { minHeight: 84, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, fontSize: 14, fontFamily: fonts.sans, color: colors.text, backgroundColor: "#fff", textAlignVertical: "top" },
  save: { borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: colors.plum },
  saveOff: { opacity: 0.5 },
  saveText: { color: "#fff", fontSize: 15, fontFamily: fonts.sansBold },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 14, backgroundColor: "#fff" },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13, fontFamily: fonts.sans, color: colors.text },
  result: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 11, borderWidth: 1, borderColor: colors.line },
  resultEmoji: { fontSize: 20 },
  resultName: { flex: 1, fontSize: 13, fontFamily: fonts.sansMedium, color: colors.plumDeep },
  resultKcal: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.textMuted },

  verdict: { marginHorizontal: 18, marginTop: 16, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", shadowColor: "#5B2A4A", shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  toneBand: { height: 36, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18 },
  toneLabel: { fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 0.6, color: "#fff" },
  verdictBody: { padding: 18, paddingTop: 16 },
  verdictFood: { fontSize: 22, fontFamily: fonts.sansBold, color: colors.plumDeep, lineHeight: 26 },
  verdictReason: { fontSize: 14, fontFamily: fonts.sans, color: colors.text, lineHeight: 20, marginTop: 7 },
  swap: { backgroundColor: colors.plumSoft, borderRadius: 16, padding: 14, marginTop: 14 },
  swapHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  swapHeadText: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.7, textTransform: "uppercase", color: colors.plumDeep },
  swapText: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 7, lineHeight: 19 },
  swapWhy: { fontSize: 11, fontFamily: fonts.sansMedium, color: colors.plumBright, marginTop: 3 },
  verdictDetail: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 13, lineHeight: 18 },

  logCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 18, marginTop: 12, backgroundColor: colors.plum, borderRadius: 14, paddingVertical: 14 },
  logCtaText: { color: "#fff", fontSize: 14.5, fontFamily: fonts.sansBold },
});
