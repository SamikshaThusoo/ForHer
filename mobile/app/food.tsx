import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Check, Lock, ChevronDown, Sprout, Search, Mic, Square } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { logMeal, logText, logPrescribed, onPlanMealsThisWeek, type MealType } from "@/lib/forher/foodlog";
import { mealPlanUnlocked, prescribedFor } from "@/lib/forher/mealplan";
import { useVoice } from "@/lib/useVoice";
import { FOODS } from "@/data/foods";
import { colors, fonts } from "@/theme/tokens";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function Food() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: string }>();
  const meal: MealType = params.meal === "lunch" || params.meal === "dinner" ? params.meal : "breakfast";
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const unlocked = mealPlanUnlocked(persona, fh.day);

  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [showElse, setShowElse] = useState(false);
  const [weekCount, setWeekCount] = useState(0);
  const [interim, setInterim] = useState("");
  const voice = useVoice((fin) => setText((t) => (t.trim() ? t.trim() + " " : "") + fin), setInterim);
  useEffect(() => { setWeekCount(onPlanMealsThisWeek()); }, []);

  const done = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const savePrescribed = (name: string) => { logPrescribed(meal, name); done(); };
  const saveText = () => { if (text.trim()) { logText(meal, text, "typed"); done(); } };
  const saveCatalog = (id: string, name: string) => { logMeal(meal, id, name); done(); };

  const results = useMemo(() => (q.trim() ? FOODS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : []), [q]);

  const logger = (
    <View style={styles.loggerBody}>
      <View style={styles.fieldHead}>
        <Text style={styles.fieldLabel}>What did you eat?</Text>
        {voice.supported && (
          <Pressable onPress={() => (voice.listening ? voice.stop() : voice.start())} style={[styles.mic, voice.listening && styles.micOn]}>
            {voice.listening ? <Square size={14} color="#fff" /> : <Mic size={15} color={colors.plumBright} />}
            <Text style={[styles.micText, voice.listening && styles.micTextOn]}>{voice.listening ? "Stop" : "Speak"}</Text>
          </Pressable>
        )}
      </View>
      <TextInput
        style={styles.field}
        value={text}
        onChangeText={setText}
        placeholder="Type or speak what you ate — e.g. two rotis, dal and a bowl of curd"
        placeholderTextColor={colors.textMuted}
        multiline
      />
      {voice.listening && <Text style={styles.interim}>{interim ? `“${interim}”` : "Listening… say what you ate"}</Text>}
      <Pressable onPress={saveText} disabled={!text.trim()} style={[styles.save, !text.trim() && styles.saveOff]}>
        <Text style={styles.saveText}>Save {meal}</Text>
      </Pressable>

      <View style={styles.searchWrap}>
        <Search size={15} color={colors.textMuted} />
        <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="…or search a food" placeholderTextColor={colors.textMuted} />
      </View>
      {results.map((f) => (
        <Pressable key={f.id} onPress={() => saveCatalog(f.id, f.name)} style={styles.result}>
          <Text style={styles.resultEmoji}>{f.imageHint ?? "🍽"}</Text>
          <Text style={styles.resultName}>{f.name}</Text>
        </Pressable>
      ))}
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
              <Pressable key={o.name} onPress={() => savePrescribed(o.name)} style={styles.optionCard}>
                <View style={styles.optionMain}>
                  <Text style={styles.optionName}>{o.name}</Text>
                  <Text style={styles.optionNote}>{o.note}</Text>
                </View>
                <View style={styles.optionDot} />
              </Pressable>
            ))}
            {weekCount > 0 && (
              <View style={styles.soft}>
                <Sprout size={13} color={colors.textSoft} />
                <Text style={styles.softText}>{weekCount} plan meal{weekCount > 1 ? "s" : ""} logged this week</Text>
              </View>
            )}
          </View>

          <Pressable onPress={() => setShowElse((s) => !s)} style={styles.elseToggle}>
            <Text style={styles.elseText}>I ate something else</Text>
            <ChevronDown size={16} color={colors.textSoft} style={{ transform: [{ rotate: showElse ? "180deg" : "0deg" }] }} />
          </Pressable>
          {showElse && logger}
        </>
      ) : (
        <>
          <Text style={styles.sub}>Log what you ate — type it or search.</Text>
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

  loggerBody: { paddingHorizontal: 18, marginTop: 8, gap: 10 },
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
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 14, backgroundColor: "#fff", marginTop: 6 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13, fontFamily: fonts.sans, color: colors.text },
  result: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 11, borderWidth: 1, borderColor: colors.line },
  resultEmoji: { fontSize: 20 },
  resultName: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.plumDeep },
});
