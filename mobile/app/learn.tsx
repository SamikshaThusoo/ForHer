import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { PressableScale } from "@/components/ui/PressableScale";
import { colors, fonts } from "@/theme/tokens";

// PCOS/PMOS micro-learning, grounded in the 2023 International Evidence-based
// Guideline for the Assessment and Management of PCOS.
const CARDS: { tag: string; title: string; body: string }[] = [
  { tag: "Why it matters", title: "PMOS and insulin", body: "Many people with PMOS are more sensitive to insulin spikes. Steadier blood sugar — from balanced meals and regular movement — eases symptoms over time, even before any weight change." },
  { tag: "Movement", title: "Move your way", body: "Aim for 150–300 minutes of moderate activity a week, plus muscle-strengthening on 2 days. No single type is better — the best exercise is the one you'll keep doing. Breaking up long sitting helps too." },
  { tag: "Food", title: "Eat for steady energy", body: "There's no one PMOS diet. Build plates around protein and fibre, swap refined carbs for low-GI options (millet over white rice), and treat food as additions, not restrictions." },
  { tag: "Your cycle", title: "Working with your phases", body: "Energy often climbs in the follicular and ovulatory phases (great for harder sessions) and dips in the luteal phase (lean into gentler movement, magnesium-rich foods and sleep). With PMOS, cycles can be irregular — logging helps you learn yours." },
  { tag: "Mind", title: "Mood is part of the picture", body: "PMOS can affect mood, anxiety and body image. This is common and treatable — if low mood lingers, that's a reason to talk to a professional, never something to push through alone." },
  { tag: "Sleep", title: "Sleep is a lever", body: "Poor sleep worsens insulin resistance and cravings. A consistent wind-down and wake time does more for PMOS than most people expect." },
];

export default function Learn() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen>
      <Header title="For Her · PMOS" />
      <View style={styles.hero}>
        <Text style={styles.h1}>Learn about <Text style={styles.h1em}>PMOS</Text></Text>
        <Text style={styles.lead}>Short, practical reads — built on the 2023 international PMOS (PCOS) guideline.</Text>
      </View>

      <View style={styles.cards}>
        {CARDS.map((c, i) => {
          const isOpen = open === i;
          return (
            <PressableScale key={c.title} onPress={() => setOpen(isOpen ? null : i)} style={[styles.card, isOpen && styles.cardOpen]}>
              <Text style={styles.tag}>{c.tag}</Text>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                <Text style={styles.chev}>{isOpen ? "–" : "+"}</Text>
              </View>
              {isOpen && <Text style={styles.body}>{c.body}</Text>}
            </PressableScale>
          );
        })}
      </View>

      <Text style={styles.disclaimer}>General education for wellbeing — not medical advice. Check with your clinician for anything health-related.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8 },
  h1: { fontSize: 26, fontFamily: fonts.serif, color: colors.plumDeep },
  h1em: { fontFamily: fonts.serif, fontStyle: "italic", color: colors.plumBright },
  lead: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 18 },

  cards: { paddingHorizontal: 18, gap: 10, marginTop: 6 },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 14 },
  cardOpen: { borderColor: "rgba(142,83,120,0.35)" },
  tag: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  cardTitle: { flex: 1, fontSize: 16, fontFamily: fonts.serif, color: colors.plumDeep },
  chev: { fontSize: 20, fontFamily: fonts.sans, color: colors.plumBright, marginLeft: 10 },
  body: { fontSize: 13, fontFamily: fonts.sans, color: "#4A3A44", lineHeight: 20, marginTop: 10 },

  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginHorizontal: 22, marginTop: 20, lineHeight: 14 },
});
