import { type ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Check, type LucideIcon } from "lucide-react-native";
import { fonts } from "@/theme/tokens";

// Card variant → background + icon colours. Mirrors the .car* classes in home.module.css.
const DEF_IC_BG = "rgba(142,83,120,0.12)";
const DEF_IC = "#8E5378";
export const VARIANTS: Record<string, { grad?: [string, string]; solid?: string; icBg: string; ic: string; eyebrow?: string }> = {
  cycle: { grad: ["#FCEEF1", "#FBF3F5"], icBg: "rgba(199,107,122,0.16)", ic: "#C76B7A" },
  clinical: { grad: ["#FBEFE6", "#FCF6EE"], icBg: "rgba(181,83,47,0.14)", ic: "#B5532F", eyebrow: "#B5532F" },
  scan: { solid: "#fff", icBg: "rgba(47,122,122,0.12)", ic: "#2F7A7A" },
  steps: { grad: ["#FBF0E4", "#FCF5EC"], icBg: "rgba(201,119,42,0.14)", ic: "#C9772A" },
  learn: { grad: ["#EEF2FB", "#F5F8FE"], icBg: DEF_IC_BG, ic: DEF_IC },
  breathe: { grad: ["#E7F2EE", "#F3F9F7"], icBg: "rgba(45,122,100,0.14)", ic: "#2F7A64" },
  plain: { solid: "#fff", icBg: DEF_IC_BG, ic: DEF_IC },
};

/** The card shell — gradient or solid, fixed height, shadow. */
export function CardShell({ variant, onPress, customBg, children }: {
  variant: keyof typeof VARIANTS | string; onPress?: () => void; customBg?: string; children: ReactNode;
}) {
  const v = VARIANTS[variant] ?? VARIANTS.plain;
  const inner = <View style={styles.inner}>{children}</View>;
  const body = v.grad && !customBg ? (
    <LinearGradient colors={v.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>{inner}</LinearGradient>
  ) : (
    <View style={[styles.card, { backgroundColor: customBg ?? v.solid ?? "#fff" }]}>{inner}</View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

export function CardIcon({ variant, Icon, bg, color }: { variant?: string; Icon: LucideIcon; bg?: string; color?: string }) {
  const v = VARIANTS[variant ?? "plain"] ?? VARIANTS.plain;
  return (
    <View style={[styles.icon, { backgroundColor: bg ?? v.icBg }]}>
      <Icon size={22} color={color ?? v.ic} />
    </View>
  );
}

export function Cta({ label, icon = "arrow", color = "#8E5378", onPress }: {
  label: string; icon?: "arrow" | "check" | null; color?: string; onPress?: () => void;
}) {
  const content = (
    <View style={styles.cta}>
      {icon === "check" && <Check size={14} color={color} />}
      <Text style={[styles.ctaText, { color }]}>{label}</Text>
      {icon === "arrow" && <ArrowRight size={14} color={color} />}
    </View>
  );
  return onPress ? <Pressable onPress={onPress} style={styles.ctaWrap}>{content}</Pressable> : <View style={styles.ctaWrap}>{content}</View>;
}

export const carStyles = StyleSheet.create({
  eyebrow: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.6, textTransform: "uppercase", color: "#8E5378" },
  title: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 23, color: "#3E1B33", marginTop: 9 },
  consultQ: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 20, color: "#3E1B33", marginTop: 8 },
  sub: { fontSize: 12.5, lineHeight: 18, fontFamily: fonts.sans, color: "#6B5A65", marginTop: 8 },
  spacer: { flex: 1 },
});

const styles = StyleSheet.create({
  card: {
    height: 210, borderRadius: 20, overflow: "hidden",
    shadowColor: "#5B2A4A", shadowOpacity: 0.1, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },
  inner: { flex: 1, padding: 17, paddingTop: 18 },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  ctaWrap: { marginTop: "auto", alignSelf: "flex-start" },
  cta: { flexDirection: "row", alignItems: "center", gap: 6 },
  ctaText: { fontSize: 12.5, fontFamily: fonts.sansBold },
});
