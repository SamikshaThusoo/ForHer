import { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Info, ArrowRight, Check, Minus, Stethoscope, FlaskConical } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { usePersona } from "@/context/PersonaContext";
import type { AssessmentAnswers, DomainSignals, RiskOutcome, CareTrack } from "@/types/journey";
import { getDomainSignals, getRiskOutcome, clinicPlanFor, type CareItem } from "@/lib/journey";
import { markAssessed, readCycleLog } from "@/lib/forher/state";
import { activeConditions } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { colors, fonts } from "@/theme/tokens";

type Step = "questions" | "result" | "recommend" | "hub";
const BLANK: AssessmentAnswers = { irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false };
const QUESTIONS: { key: keyof AssessmentAnswers; domain: string; q: string; yes: string; no: string }[] = [
  { key: "irregularPeriods", domain: "Your cycle", q: "How predictable is your period?", yes: "All over the place", no: "Fairly regular" },
  { key: "acneSkin", domain: "Skin", q: "Acne or oily skin that won't settle — especially around the jaw?", yes: "Yes, persistent", no: "Rarely" },
  { key: "hairChanges", domain: "Hair", q: "Noticed unwanted facial or body hair, or thinning at the scalp?", yes: "Yes, noticed it", no: "No changes" },
  { key: "weightDifficulty", domain: "Energy & weight", q: "Does weight cling on, even when you eat well and move?", yes: "Yes, it clings on", no: "Feels manageable" },
  { key: "familyHistory", domain: "Family", q: "Diabetes or PMOS (PCOS) anywhere in your family?", yes: "Yes", no: "No / not sure" },
];
const OUTCOME_LABEL: Record<RiskOutcome, string> = { none: "None", low: "Low", medium: "Medium", high: "High" };
const OUTCOME_IDX: Record<RiskOutcome, number> = { none: 0, low: 1, medium: 2, high: 3 };
const DOMAINS: { key: keyof Pick<DomainSignals, "androgenic" | "metabolic" | "polyendocrine">; label: string; hint: string }[] = [
  { key: "androgenic", label: "Androgenic", hint: "Skin & hair signs" },
  { key: "metabolic", label: "Metabolic", hint: "Weight & blood sugar" },
  { key: "polyendocrine", label: "Polyendocrine", hint: "Cycle & hormones" },
];

export default function ForHer() {
  const { persona } = usePersona();
  const router = useRouter();
  const pmos = persona.pmos;
  const [step, setStep] = useState<Step>("questions");
  const [answers, setAnswers] = useState<AssessmentAnswers>(pmos?.assessment ?? BLANK);
  const [consented, setConsented] = useState(false);

  const signals = useMemo(() => getDomainSignals(answers, pmos?.ahcMarkers), [answers, pmos]);
  const outcome = useMemo(() => getRiskOutcome(answers, pmos?.ahcMarkers), [answers, pmos]);
  const confidence: "high" | "low" = !pmos?.hasAhc ? "low" : signals.confidence;
  const flags = { acneOrHirsutism: signals.androgenic, ttc: !!pmos?.ttc, highMetabolic: outcome === "high" };

  const cycleLog = readCycleLog(persona.id);
  const hasConditions = activeConditions({
    persona, cycleLog, dayLog: readDayLog(persona.id),
    cycleLength: cycleLengthFor(persona, cycleLog?.cycleLength), today: new Date(),
  }).length > 0;

  const enroll = () => { markAssessed(persona.id); router.replace("/"); };
  const goClinic = () => { markAssessed(persona.id); router.push("/clinic" as never); };

  if (!pmos?.eligible) {
    return (
      <Screen>
        <Header title="For Her" />
        <View style={styles.center}><Text style={styles.muted}>For Her isn&apos;t available for this profile.</Text></View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="For Her" />

      {step === "questions" && (
        <View style={styles.wrap}>
          <Text style={styles.title}>A few quick questions</Text>
          <Text style={styles.lead}>No right answers and no diagnosis — just tell us how things have felt lately. Takes about 2 minutes.</Text>
          {QUESTIONS.map((item) => (
            <View key={item.key} style={styles.q}>
              <Text style={styles.domain}>{item.domain}</Text>
              <Text style={styles.qtext}>{item.q}</Text>
              <View style={styles.pills}>
                <Pressable onPress={() => setAnswers((p) => ({ ...p, [item.key]: true }))} style={[styles.pill, answers[item.key] && styles.pillYes]}>
                  <Text style={[styles.pillText, answers[item.key] && styles.pillTextOn]}>{item.yes}</Text>
                </Pressable>
                <Pressable onPress={() => setAnswers((p) => ({ ...p, [item.key]: false }))} style={[styles.pill, !answers[item.key] && styles.pillNo]}>
                  <Text style={[styles.pillText, !answers[item.key] && styles.pillTextOn]}>{item.no}</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Pressable onPress={() => setStep("result")} style={styles.cta}>
            <Text style={styles.ctaText}>See my result</Text><ArrowRight size={16} color="#fff" />
          </Pressable>
        </View>
      )}

      {step === "result" && (
        <View style={styles.wrap}>
          <Text style={styles.eyebrow}>Your result · a screen, not a diagnosis</Text>
          <Text style={styles.title}>{outcome === "none" ? "No PMOS signals right now" : `${OUTCOME_LABEL[outcome]} likelihood of PMOS`}</Text>
          <View style={styles.meter}>
            {(["none", "low", "medium", "high"] as RiskOutcome[]).map((o) => {
              const active = OUTCOME_IDX[o] === OUTCOME_IDX[outcome];
              return <View key={o} style={[styles.stop, active && styles.stopActive]}><Text style={[styles.stopText, active && styles.stopTextOn]}>{OUTCOME_LABEL[o]}</Text></View>;
            })}
          </View>
          <Text style={styles.explain}>We look at three domains. Signals in any two of three point to a higher likelihood.</Text>
          {DOMAINS.map((d) => {
            const met = signals[d.key];
            return (
              <View key={d.key} style={styles.domainRow}>
                <View style={[styles.domainIcon, met && styles.domainIconMet]}>{met ? <Check size={14} color="#fff" /> : <Minus size={14} color={colors.textMuted} />}</View>
                <View style={styles.domainMain}><Text style={styles.dlabel}>{d.label}</Text><Text style={styles.dhint}>{d.hint}</Text></View>
                <Text style={styles.dstate}>{met ? "Signal present" : "No signal"}</Text>
              </View>
            );
          })}
          {confidence === "low" && (
            <View style={styles.caveat}>
              <Info size={15} color={colors.plumBright} />
              <Text style={styles.caveatText}><Text style={styles.bold}>Confidence: indicative. </Text>Without lab values we&apos;ve screened on your answers alone.</Text>
            </View>
          )}
          <Pressable onPress={() => { if (outcome === "none") { hasConditions ? goClinic() : enroll(); } else setStep("recommend"); }} style={styles.cta}>
            <Text style={styles.ctaText}>{outcome === "none" ? "See what's next" : "See my care plan"}</Text><ArrowRight size={16} color="#fff" />
          </Pressable>
        </View>
      )}

      {step === "recommend" && <RecommendStep tier={outcome} flags={flags} onContinue={() => setStep("hub")} />}

      {step === "hub" && (
        <View style={styles.wrap}>
          <Text style={styles.eyebrow}>A few ways we&apos;ll support you</Text>
          <Text style={styles.title}>Your care, in one place</Text>
          <Text style={styles.lead}>Book a visit, meet your team, keep your profile current — anytime, from the Clinic tab.</Text>
          <Pressable onPress={() => setConsented((c) => !c)} style={styles.consent}>
            <View style={[styles.checkbox, consented && styles.checkboxOn]}>{consented && <Check size={13} color="#fff" strokeWidth={3} />}</View>
            <Text style={styles.consentText}>I understand this is lifestyle support — not a diagnosis or prescription.</Text>
          </Pressable>
          <Pressable onPress={enroll} disabled={!consented} style={[styles.cta, !consented && styles.ctaOff]}>
            <Text style={styles.ctaText}>Start my plan</Text><ArrowRight size={16} color="#fff" />
          </Pressable>
          <Pressable onPress={goClinic} style={styles.skip}><Text style={styles.skipText}>Not now — just book a check-in</Text></Pressable>
        </View>
      )}
    </Screen>
  );
}

function RecommendStep({ tier, flags, onContinue }: { tier: CareTrack; flags: { acneOrHirsutism: boolean; ttc: boolean; highMetabolic: boolean }; onContinue: () => void }) {
  const plan = clinicPlanFor(tier, flags);
  const items = [plan.primary, ...plan.secondary].filter(Boolean) as CareItem[];
  const tests = items.filter((i) => i.kind === "test");
  const consults = items.filter((i) => i.kind === "consult");
  const Row = ({ item }: { item: CareItem }) => {
    const Icon = item.kind === "test" ? FlaskConical : Stethoscope;
    return (
      <View style={styles.recRow}>
        <View style={styles.recIcon}><Icon size={17} color={colors.plumBright} /></View>
        <View style={styles.recBody}><Text style={styles.recLabel}>{item.label}</Text><Text style={styles.recReason}>{item.reason}</Text></View>
      </View>
    );
  };
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>What we recommend</Text>
      <Text style={styles.title}>Here&apos;s what would help</Text>
      <Text style={styles.lead}>Based on your screen — you can book these once you start your plan.</Text>
      {tests.length > 0 && <><Text style={styles.recSection}>Recommended tests</Text>{tests.map((t) => <Row key={t.id} item={t} />)}</>}
      {consults.length > 0 && <><Text style={styles.recSection}>Doctor appointments</Text>{consults.map((c) => <Row key={c.id} item={c} />)}</>}
      <Pressable onPress={onContinue} style={styles.cta}><Text style={styles.ctaText}>Continue</Text><ArrowRight size={16} color="#fff" /></Pressable>
      <Text style={styles.disclaimer}>This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 4 },
  center: { padding: 40, alignItems: "center" },
  muted: { fontSize: 13, fontFamily: fonts.sans, color: colors.textSoft },
  eyebrow: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.5, textTransform: "uppercase", color: colors.plumBright },
  title: { fontSize: 23, fontFamily: fonts.serif, color: colors.plumDeep, marginTop: 4 },
  lead: { fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 7, lineHeight: 18 },

  q: { marginTop: 16 },
  domain: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.plumBright },
  qtext: { fontSize: 14.5, fontFamily: fonts.sansMedium, color: colors.plumDeep, marginTop: 4, lineHeight: 20 },
  pills: { flexDirection: "row", gap: 8, marginTop: 8 },
  pill: { flex: 1, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 12, paddingVertical: 11, alignItems: "center", backgroundColor: "#fff" },
  pillYes: { backgroundColor: colors.plum, borderColor: colors.plum },
  pillNo: { backgroundColor: "#5B7A64", borderColor: "#5B7A64" },
  pillText: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.plumDeep },
  pillTextOn: { color: "#fff" },

  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.plum, borderRadius: 14, paddingVertical: 14, marginTop: 20 },
  ctaOff: { opacity: 0.5 },
  ctaText: { color: "#fff", fontSize: 14.5, fontFamily: fonts.sansBold },

  meter: { flexDirection: "row", gap: 6, marginTop: 14 },
  stop: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: "center", backgroundColor: "rgba(142,83,120,0.08)" },
  stopActive: { backgroundColor: colors.plum },
  stopText: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.textSoft },
  stopTextOn: { color: "#fff" },
  explain: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 12, lineHeight: 17 },
  domainRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  domainIcon: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(91,42,74,0.06)" },
  domainIconMet: { backgroundColor: colors.plumBright },
  domainMain: { flex: 1 },
  dlabel: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  dhint: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted },
  dstate: { fontSize: 11.5, fontFamily: fonts.sansMedium, color: colors.textSoft },
  caveat: { flexDirection: "row", gap: 9, marginTop: 14, backgroundColor: "rgba(142,83,120,0.06)", borderWidth: 1, borderColor: "rgba(142,83,120,0.2)", borderRadius: 13, padding: 12 },
  caveatText: { flex: 1, fontSize: 12, fontFamily: fonts.sans, color: "#4A3A44", lineHeight: 17 },
  bold: { fontFamily: fonts.sansBold, color: colors.plumDeep },

  recSection: { fontSize: 10.5, fontFamily: fonts.sansBold, letterSpacing: 0.4, textTransform: "uppercase", color: colors.textMuted, marginTop: 18, marginBottom: 8 },
  recRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 13, marginBottom: 9 },
  recIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(142,83,120,0.1)" },
  recBody: { flex: 1 },
  recLabel: { fontSize: 13.5, fontFamily: fonts.sansBold, color: colors.plumDeep },
  recReason: { fontSize: 12, fontFamily: fonts.sans, color: colors.textSoft, marginTop: 2, lineHeight: 17 },
  disclaimer: { fontSize: 9.5, fontFamily: fonts.sans, fontStyle: "italic", color: colors.textMuted, textAlign: "center", marginTop: 16, lineHeight: 14 },

  consent: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 18 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxOn: { backgroundColor: colors.plum, borderColor: colors.plum },
  consentText: { flex: 1, fontSize: 12.5, fontFamily: fonts.sans, color: colors.textSoft, lineHeight: 18 },
  skip: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  skipText: { fontSize: 12.5, fontFamily: fonts.sansMedium, color: colors.textSoft },
});
