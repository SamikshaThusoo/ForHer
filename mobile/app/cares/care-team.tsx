import { View, Text, StyleSheet } from "react-native";
import { ShieldCheck, Stethoscope, HeartHandshake, FlaskConical } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { usePersona } from "@/context/PersonaContext";
import { colors, fonts } from "@/theme/tokens";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export default function CareTeam() {
  const { persona } = usePersona();
  const { nextDoctorConsult, nextCoachSession, daysToMidRetest = 21 } = persona.cares;

  return (
    <Screen>
      <Header title="For Her · Care team" />
      <View style={styles.hero}>
        <Text style={styles.title}>Your care team</Text>
        <Text style={styles.sub}>Tele-doctor, weekly coach, and your next retest.</Text>
      </View>

      <View style={styles.retest}>
        <View style={styles.retestIcon}><FlaskConical size={20} color="#fff" /></View>
        <View style={styles.retestBody}>
          <Text style={styles.retestLabel}>Next retest</Text>
          <Text style={styles.retestVal}>in {daysToMidRetest} days</Text>
        </View>
      </View>

      {nextDoctorConsult && (
        <View style={styles.card}>
          <View style={styles.cardIcon}><Stethoscope size={20} color={colors.plumBright} /></View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>Doctor consult</Text>
            <Text style={styles.cardName}>{nextDoctorConsult.doctor}</Text>
            <Text style={styles.cardDate}>{fmtDate(nextDoctorConsult.date)}</Text>
          </View>
        </View>
      )}

      {nextCoachSession && (
        <View style={styles.card}>
          <View style={styles.cardIcon}><HeartHandshake size={20} color={colors.plumBright} /></View>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>Coach session</Text>
            <Text style={styles.cardName}>{nextCoachSession.coach}</Text>
            <Text style={styles.cardDate}>{fmtDate(nextCoachSession.date)}</Text>
          </View>
        </View>
      )}

      <View style={styles.privacy}>
        <ShieldCheck size={14} color="#236B6B" strokeWidth={2} />
        <Text style={styles.privacyText}>
          <Text style={styles.privacyLabel}>Privacy: </Text>
          your employer only sees aggregated workforce metrics. Individual data stays between you and your care team.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 10 },
  title: { fontSize: 24, fontFamily: fonts.serif, color: colors.plumDeep },
  sub: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 4 },
  retest: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 18, backgroundColor: colors.plum, borderRadius: 16, padding: 15 },
  retestIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.2)" },
  retestBody: { flex: 1 },
  retestLabel: { fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: "rgba(255,255,255,0.8)" },
  retestVal: { fontSize: 18, fontFamily: fonts.serif, color: "#fff", marginTop: 2 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 18, marginTop: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 14 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)" },
  cardBody: { flex: 1 },
  cardLabel: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.plumBright },
  cardName: { fontSize: 15, fontFamily: fonts.sansBold, color: colors.plumDeep, marginTop: 2 },
  cardDate: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 1 },
  privacy: { flexDirection: "row", gap: 8, marginHorizontal: 18, marginTop: 18, backgroundColor: "rgba(47,122,122,0.07)", borderWidth: 1, borderColor: "rgba(47,122,122,0.2)", borderRadius: 13, padding: 12 },
  privacyText: { flex: 1, fontSize: 11.5, fontFamily: fonts.sans, color: "#4A3A44", lineHeight: 17 },
  privacyLabel: { fontFamily: fonts.sansBold, color: "#236B6B" },
});
