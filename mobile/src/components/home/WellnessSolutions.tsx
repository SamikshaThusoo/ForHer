import { View, Text, ScrollView, StyleSheet } from "react-native";
import { FlaskConical, Stethoscope, MessageCircle, Dumbbell, Pill, type LucideIcon } from "lucide-react-native";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const SOLUTIONS: { label: string; Icon: LucideIcon; active?: boolean }[] = [
  { label: "Lab Tests", Icon: FlaskConical, active: true },
  { label: "Consult", Icon: Stethoscope },
  { label: "Your Dost", Icon: MessageCircle },
  { label: "Gym", Icon: Dumbbell },
  { label: "Pharmacy", Icon: Pill },
];

/** "Range of wellness solutions" — horizontal row of tabs, Lab Tests active. */
export function WellnessSolutions() {
  return (
    <>
      <Text style={styles.secH}>Range of wellness solutions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SOLUTIONS.map((s) => (
          <View key={s.label} style={styles.well}>
            <View style={[styles.ic, s.active && styles.icActive]}>
              <s.Icon size={26} strokeWidth={1.6} color={hh.blue} />
            </View>
            <Text style={[styles.l, s.active && styles.lActive]}>{s.label}</Text>
            {s.active && <View style={styles.underline} />}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  secH: { marginHorizontal: 18, marginTop: 20, fontSize: 15, fontFamily: fonts.sansBold, color: hh.text },
  row: { gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },
  well: { width: 80, alignItems: "center", paddingVertical: 4 },
  ic: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#F4F6FA", alignItems: "center", justifyContent: "center" },
  icActive: { backgroundColor: hh.blueSoft },
  l: { fontSize: 11.5, fontFamily: fonts.sansMedium, color: hh.text, marginTop: 8 },
  lActive: { color: hh.blue, fontFamily: fonts.sansBold },
  underline: { width: 28, height: 3, borderRadius: 3, backgroundColor: hh.blue, marginTop: 8 },
});
