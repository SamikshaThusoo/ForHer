import { useState, type ReactNode, Children } from "react";
import { View, useWindowDimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import { colors } from "@/theme/tokens";

/**
 * Center-focus carousel: the centred card is full-size + opaque, neighbours scale
 * down and fade (RN stand-in for the web's blur+scale). Snaps card-to-card and
 * shows an active-dot bar below. Mirrors the web FocusCarousel.
 */
export function FocusCarousel({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const { width } = useWindowDimensions();
  const CARD_W = Math.round(width * 0.72);
  const GAP = 12;
  const SNAP = CARD_W + GAP;
  const SIDE = (width - CARD_W) / 2;

  const x = useSharedValue(0);
  const [active, setActive] = useState(0);
  const onScroll = useAnimatedScrollHandler({ onScroll: (e) => { x.value = e.contentOffset.x; } });

  return (
    <View style={styles.wrap}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / SNAP))}
        contentContainerStyle={{ paddingHorizontal: SIDE - GAP / 2, paddingVertical: 8 }}
      >
        {items.map((child, i) => (
          <Slide key={i} index={i} x={x} snap={SNAP} width={CARD_W} gap={GAP}>{child}</Slide>
        ))}
      </Animated.ScrollView>
      <View style={styles.dots}>
        {items.map((_, i) => <View key={i} style={[styles.dot, i === active && styles.dotOn]} />)}
      </View>
    </View>
  );
}

function Slide({ index, x, snap, width, gap, children }: {
  index: number; x: SharedValue<number>; snap: number; width: number; gap: number; children: ReactNode;
}) {
  const anim = useAnimatedStyle(() => {
    const pos = (x.value / snap) - index;
    const scale = interpolate(pos, [-1, 0, 1], [0.88, 1, 0.88], Extrapolation.CLAMP);
    const opacity = interpolate(pos, [-1, 0, 1], [0.45, 1, 0.45], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });
  return (
    <Animated.View style={[{ width, marginHorizontal: gap / 2 }, anim]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 6 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(91,42,74,0.2)" },
  dotOn: { width: 18, backgroundColor: colors.plum },
});
