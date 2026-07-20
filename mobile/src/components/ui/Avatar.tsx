import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { SvgXml } from "react-native-svg";
import { avatarSvgFor } from "@/lib/avatar";

/** Deterministic seeded avatar rendered from raw DiceBear SVG via react-native-svg. */
export function Avatar({ seed, size = 38, kind = "flat", style }: {
  seed: string;
  size?: number;
  kind?: "neutral" | "hero" | "soft" | "flat";
  style?: object;
}) {
  const xml = useMemo(() => avatarSvgFor(seed, kind), [seed, kind]);
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }, styles.bg, style]}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: "rgba(142,83,120,0.10)" },
});
