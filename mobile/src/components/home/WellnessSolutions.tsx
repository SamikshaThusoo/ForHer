import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Stethoscope, FlaskConical, Store, Dumbbell, Building2, type LucideIcon } from "lucide-react-native";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const SOLUTIONS: { label: string; Icon: LucideIcon }[] = [
  { label: "Doctor\nConsult", Icon: Stethoscope },
  { label: "Lab Tests", Icon: FlaskConical },
  { label: "Pharmacy", Icon: Store },
  { label: "Gym", Icon: Dumbbell },
  { label: "In-clinic\nConsult", Icon: Building2 },
];

/** "Extensive Range Of Wellness" — flat blue line icons, matching the real app. */
export function WellnessSolutions() {
  return (
    <>
      <Text style={styles.secH}>Extensive Range Of Wellness</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SOLUTIONS.map((s) => (
          <View key={s.label} style={styles.well}>
            <s.Icon size={30} strokeWidth={1.5} color={hh.blue} />
            <Text style={styles.l}>{s.label}</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  secH: { marginHorizontal: 16, marginTop: 20, fontSize: 15.5, fontFamily: fonts.sansBold, color: hh.text },
  row: { gap: 4, paddingHorizontal: 10, paddingTop: 16, paddingBottom: 4 },
  well: { width: 72, alignItems: "center", gap: 9 },
  l: { fontSize: 11, fontFamily: fonts.sansMedium, color: hh.text, textAlign: "center", lineHeight: 14 },
});
