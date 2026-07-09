import type { CyclePhase } from "../types/journey";

// Ported from the web app's fhTheme + phase palette. Plain constants for RN StyleSheet.
export const colors = {
  plum: "#5B2A4A",
  plumBright: "#8E5378",
  plumDeep: "#3E1B33",
  plumSoft: "#F5ECF1",
  text: "#3E1B33",
  textSoft: "#6B5A65",
  textMuted: "#9A8A92",
  surface: "#FFFFFF",
  bgTop: "#FBF3F5",
  bgBottom: "#F5F0F6",
  orange: "#C9772A",
  orangeDeep: "#B5532F",
  line: "rgba(91,42,74,0.10)",
  lineStrong: "rgba(91,42,74,0.16)",
};

// Task's phase palette: menstrual rose, follicular gold, ovulation teal, luteal plum.
export const phaseAccent: Record<CyclePhase, { main: string; deep: string; soft: string; line: string }> = {
  menstrual: { main: "#C76B7A", deep: "#A34E5E", soft: "rgba(199,107,122,0.10)", line: "rgba(199,107,122,0.30)" },
  follicular: { main: "#C9A24A", deep: "#997629", soft: "rgba(201,162,74,0.12)", line: "rgba(201,162,74,0.34)" },
  ovulatory: { main: "#2F7A7A", deep: "#236B6B", soft: "rgba(47,122,122,0.10)", line: "rgba(47,122,122,0.30)" },
  luteal: { main: "#8E5378", deep: "#6E3C5C", soft: "rgba(142,83,120,0.10)", line: "rgba(142,83,120,0.30)" },
};

// DM Serif Display / DM Sans get loaded via expo-font; fall back to system until then.
export const fonts = {
  serif: "DMSerifDisplay",
  sans: "DMSans",
};

export const gradients = {
  bg: [colors.bgTop, colors.bgBottom] as const,
  plum: ["#5B2A4A", "#8E5378"] as const,
};
