import { useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Send, Sparkles } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { usePersona } from "@/context/PersonaContext";
import { ASK_SEEDS } from "@/data/askResponses";
import { colors, fonts } from "@/theme/tokens";

interface Msg { role: "user" | "habit"; text: string; citation?: string }

const SUGGESTIONS = [
  "Can I have biryani tonight?",
  "Why am I tired after lunch?",
  "What's a good snack at 4pm?",
  "Can I stop my BP medication?",
];

export default function Ask() {
  const { persona } = usePersona();
  const scroller = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "habit", text: `Hi ${persona.shortName}. I'm Habit. Ask me anything about your meals, your plan, or your labs — I'll answer with your data in mind.`, citation: "Grounded in your Smart Report" },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    const seed = ASK_SEEDS.find((s) => s.prompt.toLowerCase() === q.toLowerCase());
    setTimeout(() => {
      setMessages((m) => [...m, seed
        ? { role: "habit", text: seed.reply, citation: seed.citation }
        : { role: "habit", text: "I'll come back to you on this with a personalised answer based on your labs. (Prototype response.)", citation: "Prototype response" }]);
      setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
    }, 500);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <Screen scroll={false}>
      <Header title="For Her · Ask" />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <View style={styles.hero}>
          <Text style={styles.title}>Ask Habit</Text>
          <Text style={styles.sub}>Grounded in your labs. Clinical questions route to your doctor.</Text>
        </View>

        <ScrollView ref={scroller} style={styles.fill} contentContainerStyle={styles.thread} showsVerticalScrollIndicator={false}>
          {messages.map((m, i) =>
            m.role === "user" ? (
              <View key={i} style={[styles.bubbleWrap, styles.userWrap]}>
                <View style={[styles.bubble, styles.userBubble]}>
                  <Text style={[styles.bubbleText, styles.userText]}>{m.text}</Text>
                  {m.citation && <Text style={[styles.citation, styles.userCite]}>{m.citation}</Text>}
                </View>
              </View>
            ) : (
              <View key={i} style={styles.habitRow}>
                <View style={styles.avatar}><Sparkles size={14} strokeWidth={1.9} color={colors.plumBright} /></View>
                <View style={[styles.bubble, styles.habitBubble]}>
                  <Text style={styles.brandLabel}>Habit</Text>
                  <Text style={styles.bubbleText}>{m.text}</Text>
                  {m.citation && <Text style={styles.citation}>{m.citation}</Text>}
                </View>
              </View>
            ),
          )}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestScroll} contentContainerStyle={styles.suggests} keyboardShouldPersistTaps="handled">
          {SUGGESTIONS.map((s) => (
            <PressableScale key={s} onPress={() => send(s)} style={styles.suggest}>
              <Text style={styles.suggestText}>{s}</Text>
            </PressableScale>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Ask anything about food, your labs, your plan…" placeholderTextColor={colors.textMuted} onSubmitEditing={() => send(input)} returnKeyType="send" />
          <PressableScale onPress={() => send(input)} style={[styles.sendBtn, !input.trim() && styles.sendOff]}>
            <Send size={18} color="#fff" />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hero: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 6 },
  title: { fontSize: 24, fontFamily: fonts.serif, color: colors.plumDeep },
  sub: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 4 },
  thread: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  bubbleWrap: { maxWidth: "86%" },
  userWrap: { alignSelf: "flex-end" },
  habitRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, maxWidth: "92%", alignSelf: "flex-start" },
  avatar: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)", marginTop: 2 },
  bubble: { borderRadius: 16, padding: 12, paddingHorizontal: 14 },
  habitBubble: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 6, shadowColor: "#5B2A4A", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  brandLabel: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright, marginBottom: 4 },
  userBubble: { backgroundColor: colors.plum, borderBottomRightRadius: 6 },
  bubbleText: { fontSize: 14, fontFamily: fonts.sans, color: colors.plumDeep, lineHeight: 20 },
  userText: { color: "#fff" },
  citation: { fontSize: 10, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textSoft, marginTop: 7 },
  userCite: { color: "rgba(255,255,255,0.78)", fontStyle: "italic" },
  suggestScroll: { flexGrow: 0, flexShrink: 0 },
  suggests: { gap: 8, paddingHorizontal: 14, paddingBottom: 8, alignItems: "center" },
  suggest: { backgroundColor: "rgba(142,83,120,0.08)", borderWidth: 1, borderColor: "rgba(142,83,120,0.25)", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13 },
  suggestText: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.plumBright },
  composer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: "rgba(255,255,255,0.6)" },
  input: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10, fontSize: 13.5, fontFamily: fonts.sans, color: colors.text },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.plum, alignItems: "center", justifyContent: "center" },
  sendOff: { opacity: 0.5 },
});
