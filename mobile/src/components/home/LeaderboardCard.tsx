import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Coins, Trophy } from "lucide-react-native";
import { usePersona } from "@/context/PersonaContext";
import { PressableScale } from "@/components/ui/PressableScale";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

const PEERS = [
  { rank: 2, name: "Ankit Raj", initials: "AR", points: "5,463" },
  { rank: 3, name: "Mohit Rai", initials: "MR", points: "1,720" },
];

/** Weekly steps leaderboard — the "You" row highlighted at rank 6. */
export function LeaderboardCard() {
  const { persona } = usePersona();
  const youInitial = persona.shortName[0];

  return (
    <View style={styles.lb}>
      <View style={[styles.row, styles.first]}>
        <Text style={[styles.rk, styles.rkMe]}>6</Text>
        <View style={[styles.av, styles.avMe]}><Text style={styles.avMeText}>{youInitial}</Text></View>
        <Text style={[styles.nm, styles.nmMe]}>You</Text>
        <View style={styles.co}><Coins size={14} color={hh.goldB} fill={hh.goldB} /><Text style={styles.coText}>10,000</Text></View>
      </View>
      {PEERS.map((p) => (
        <View key={p.rank} style={styles.row}>
          <Text style={styles.rk}>{p.rank}</Text>
          <View style={[styles.av, styles.avPeer]}><Text style={styles.avPeerText}>{p.initials}</Text></View>
          <Text style={styles.nm}>{p.name}</Text>
          <View style={styles.co}><Coins size={14} color={hh.goldB} fill={hh.goldB} /><Text style={styles.coText}>{p.points}</Text></View>
        </View>
      ))}
      <PressableScale style={styles.viewWrap}>
        <LinearGradient colors={[hh.goldA, hh.goldB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.view}>
          <Trophy size={14} strokeWidth={2} color={hh.goldText} />
          <Text style={styles.viewText}>View Leaderboard</Text>
        </LinearGradient>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  lb: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 18, backgroundColor: hh.surface, padding: 16, paddingVertical: 14,
    shadowColor: "#1B2A3D", shadowOpacity: 0.07, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 7, borderTopWidth: 1, borderTopColor: hh.line },
  first: { borderTopWidth: 0 },
  rk: { width: 18, textAlign: "center", fontFamily: fonts.sansBold, fontSize: 13, color: hh.textSoft },
  rkMe: { color: hh.blue },
  av: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  avPeer: { backgroundColor: "#EEF0F4" },
  avPeerText: { fontSize: 11, fontFamily: fonts.sansBold, color: hh.textMuted },
  avMe: { backgroundColor: hh.blueSoft },
  avMeText: { fontSize: 11, fontFamily: fonts.sansBold, color: hh.blue },
  nm: { flex: 1, fontSize: 13, fontFamily: fonts.sansMedium, color: hh.text },
  nmMe: { color: hh.blue, fontFamily: fonts.sansBold },
  co: { flexDirection: "row", alignItems: "center", gap: 5 },
  coText: { fontSize: 12.5, fontFamily: fonts.sansBold, color: hh.text },
  viewWrap: { marginTop: 11 },
  view: { borderRadius: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  viewText: { fontFamily: fonts.sansBold, fontSize: 12.5, color: hh.goldText },
});
