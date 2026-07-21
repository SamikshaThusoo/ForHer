import { View, Text, StyleSheet } from "react-native";
import { Droplet, MonitorCheck, Gauge, type LucideIcon } from "lucide-react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const ITEMS: { Icon?: LucideIcon; label: string }[] = [
  { label: "Sleep" }, // no lucide zZZ glyph — rendered as styled text below
  { Icon: Droplet, label: "Blood Sugar" },
  { Icon: MonitorCheck, label: "Blood\nPressure" },
  { Icon: Gauge, label: "BMI Score" },
];

/** "Track Your Health" vitals row — flat blue icons with NA readings and a
 *  View All pill, matching the real app. */
export function TrackHealth() {
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.title}>Track Your Health</Text>
        <PressableScale style={styles.viewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </PressableScale>
      </View>
      <View style={styles.row}>
        {ITEMS.map((it) => (
          <View key={it.label} style={styles.item}>
            <View style={styles.ic}>
              {it.Icon
                ? <it.Icon size={28} strokeWidth={1.5} color={hh.blue} />
                : <Text style={styles.zzz}>zZZ</Text>}
            </View>
            <Text style={styles.label}>{it.label}</Text>
            <Text style={styles.na}>NA</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginTop: 24 },
  title: { fontSize: 16.5, fontFamily: fonts.sansBold, color: hh.text },
  viewAll: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#DCE0E6", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16 },
  viewAllText: { fontSize: 12, fontFamily: fonts.sansBold, color: hh.text },
  row: { flexDirection: "row", marginTop: 16, paddingHorizontal: 8 },
  item: { flex: 1, alignItems: "center", gap: 5 },
  ic: { height: 32, justifyContent: "center" },
  zzz: { fontSize: 16, fontFamily: fonts.sansBold, fontStyle: "italic", color: hh.blue, letterSpacing: 0.5 },
  label: { fontSize: 10.5, lineHeight: 13, fontFamily: fonts.sansMedium, color: hh.text, textAlign: "center" },
  na: { fontSize: 11.5, fontFamily: fonts.sansBold, color: hh.text },
});
