import { View, Text, StyleSheet } from "react-native";
import { usePersona } from "@/context/PersonaContext";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const PROGRAM_LABEL: Record<string, string> = {
  "prediabetes-reversal": "Prediabetes Reversal",
  "pcos-care": "PMOS Care",
  "cvd-risk-reduction": "CVD Risk Reduction",
  "hypertension-control": "Hypertension Control",
  "calorie-fit": "Calorie Fit",
};

/** "Hi <Name>" greeting + optional program/week sub-line for enrolled personas. */
export function Greeting() {
  const { persona } = usePersona();
  const fullName = `${persona.shortName}${persona.lastName ? ` ${persona.lastName}` : ""}`;
  const { enrolled, weekOfTwelve, primaryProgram } = persona.cares;
  const programLabel = (primaryProgram && PROGRAM_LABEL[primaryProgram]) || "your";

  return (
    <View style={styles.greet}>
      <Text style={styles.hi}>Hi <Text style={styles.name}>{fullName}</Text></Text>
      {enrolled && (
        <Text style={styles.sub}>Week {weekOfTwelve ?? 1} of your {programLabel} plan</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  greet: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 2 },
  hi: { fontSize: 19, fontFamily: fonts.sans, color: hh.text },
  name: { fontFamily: fonts.sansBold },
  sub: { fontSize: 12.5, fontFamily: fonts.sans, color: hh.textMuted, marginTop: 2 },
});
