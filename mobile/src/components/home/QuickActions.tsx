import { View, Text, StyleSheet } from "react-native";
import { FileText, Calendar, LineChart, type LucideIcon } from "lucide-react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const CARDS: { Icon: LucideIcon; title: string; sub: string }[] = [
  { Icon: FileText, title: "Records", sub: "Health data" },
  { Icon: Calendar, title: "Bookings", sub: "Past & upcoming" },
  { Icon: LineChart, title: "Reports", sub: "Smart insights" },
];

/** Three quick-nav cards — Records / Bookings / Reports. */
export function QuickActions() {
  return (
    <View style={styles.qa}>
      {CARDS.map((c) => (
        <PressableScale key={c.title} style={styles.card}>
          <View style={styles.ic}><c.Icon size={20} strokeWidth={1.75} color={hh.blue} /></View>
          <Text style={styles.t}>{c.title}</Text>
          <Text style={styles.s}>{c.sub}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  qa: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 16 },
  card: {
    flex: 1, backgroundColor: hh.surface, borderRadius: 16, padding: 14, paddingBottom: 12,
    shadowColor: "#1B2A3D", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  ic: { width: 36, height: 36, borderRadius: 10, backgroundColor: hh.blueSoft, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  t: { fontSize: 13, fontFamily: fonts.sansBold, color: hh.text },
  s: { fontSize: 10.5, fontFamily: fonts.sans, color: hh.textMuted, marginTop: 2 },
});
