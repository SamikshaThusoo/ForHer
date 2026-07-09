import { useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Send } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { usePersona } from "@/context/PersonaContext";
import { ASK_SEEDS } from "@/data/askResponses";
import { colors, fonts } from "@/theme/tokens";

interface Msg { role: "user" | "habit"; text: string; citation?: string }

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
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubbleWrap, m.role === "user" ? styles.userWrap : styles.habitWrap]}>
              <View style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.habitBubble]}>
                <Text style={[styles.bubbleText, m.role === "user" && styles.userText]}>{m.text}</Text>
                {m.citation && <Text style={[styles.citation, m.role === "user" && styles.userCite]}>{m.citation}</Text>}
              </View>
            </View>
          ))}
          {messages.length <= 1 && (
            <View style={styles.suggests}>
              {ASK_SEEDS.slice(0, 3).map((s) => (
                <Pressable key={s.prompt} onPress={() => send(s.prompt)} style={styles.suggest}>
                  <Text style={styles.suggestText}>{s.prompt}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Ask about your meals, plan or labs…" placeholderTextColor={colors.textMuted} onSubmitEditing={() => send(input)} returnKeyType="send" />
          <Pressable onPress={() => send(input)} style={[styles.sendBtn, !input.trim() && styles.sendOff]}>
            <Send size={18} color="#fff" />
          </Pressable>
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
  thread: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  bubbleWrap: { maxWidth: "86%" },
  userWrap: { alignSelf: "flex-end" },
  habitWrap: { alignSelf: "flex-start" },
  bubble: { borderRadius: 16, padding: 12 },
  habitBubble: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: colors.plum, borderTopRightRadius: 4 },
  bubbleText: { fontSize: 13.5, fontFamily: fonts.sans, color: colors.plumDeep, lineHeight: 20 },
  userText: { color: "#fff" },
  citation: { fontSize: 10.5, fontFamily: fonts.sansMedium, color: colors.plumBright, marginTop: 6 },
  userCite: { color: "rgba(255,255,255,0.75)" },
  suggests: { gap: 8, marginTop: 4 },
  suggest: { alignSelf: "flex-start", backgroundColor: "rgba(142,83,120,0.08)", borderWidth: 1, borderColor: "rgba(142,83,120,0.25)", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13 },
  suggestText: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.plumBright },
  composer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: "rgba(255,255,255,0.6)" },
  input: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10, fontSize: 13.5, fontFamily: fonts.sans, color: colors.text },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.plum, alignItems: "center", justifyContent: "center" },
  sendOff: { opacity: 0.5 },
});
