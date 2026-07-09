import { Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePersona } from "@/context/PersonaContext";
import { personaTrack } from "@/lib/journey";
import { colors } from "@/theme/tokens";

// Foundation smoke screen: exercises the ported data + logic + storage + context so a
// green render proves the whole shared layer works on React Native. Real screens follow.
export default function Home() {
  const { persona, allPersonas, setPersonaId } = usePersona();
  const track = personaTrack(persona);

  return (
    <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.brand}>For Her · PMOS</Text>
          <Text style={styles.h1}>Hi {persona.name}</Text>
          <Text style={styles.sub}>Care track: {track}</Text>
          <Text style={styles.note}>
            React Native foundation is running — the data, logic and storage layers are ported.
          </Text>

          <Text style={styles.label}>Switch persona (context + storage):</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {allPersonas.map((p) => {
              const on = p.id === persona.id;
              return (
                <Pressable key={p.id} onPress={() => setPersonaId(p.id)} style={[styles.pill, on && styles.pillOn]}>
                  <Text style={[styles.pillText, on && styles.pillTextOn]}>{p.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { padding: 22, gap: 8 },
  brand: { fontSize: 13, fontWeight: "700", color: colors.plum },
  h1: { fontSize: 30, color: colors.plumDeep, marginTop: 6 },
  sub: { fontSize: 14, color: colors.textSoft, marginTop: 2 },
  note: { fontSize: 13, color: colors.textSoft, marginTop: 14, lineHeight: 19 },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginTop: 22, textTransform: "uppercase" },
  row: { gap: 8, paddingVertical: 10 },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong },
  pillOn: { backgroundColor: colors.plum, borderColor: colors.plum },
  pillText: { fontSize: 13, fontWeight: "600", color: colors.plum },
  pillTextOn: { color: "#fff" },
});
