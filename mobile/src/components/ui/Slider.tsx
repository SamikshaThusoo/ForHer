import { type ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedReaction, runOnJS } from "react-native-reanimated";
import { colors } from "@/theme/tokens";

const THUMB = 22;

/** A smooth, tap-or-drag-anywhere slider built on gesture-handler + reanimated.
 *  Replaces the raw-touch-responder scrubbers (which only grabbed near the thumb).
 *  The thumb tracks the finger on the UI thread; `onChange` reports the rounded value. */
export function Slider({ value, min = 1, max, onChange, track, thumbColor = colors.plumBright, height = 26 }: {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  /** Custom track visual (e.g. a gradient); falls back to a plain bar. */
  track?: ReactNode;
  thumbColor?: string;
  height?: number;
}) {
  const w = useSharedValue(0);
  const x = useSharedValue(0);
  const dragging = useSharedValue(false);

  // Keep the thumb in sync when the value changes from outside (not mid-drag).
  useAnimatedReaction(
    () => value,
    (v) => { if (!dragging.value && w.value > 0) x.value = ((v - min) / (max - min)) * w.value; },
  );

  const commit = (px: number) => {
    "worklet";
    if (w.value <= 0) return;
    const frac = Math.min(1, Math.max(0, px / w.value));
    x.value = frac * w.value;
    runOnJS(onChange)(Math.round(min + frac * (max - min)));
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .onBegin((e) => { dragging.value = true; commit(e.x); })
    .onUpdate((e) => commit(e.x))
    .onFinalize(() => { dragging.value = false; });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - THUMB / 2 }] }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.wrap, { height }]}
        hitSlop={{ top: 10, bottom: 10 }}
        onLayout={(e) => {
          w.value = e.nativeEvent.layout.width;
          if (!dragging.value) x.value = ((value - min) / (max - min)) * w.value;
        }}
      >
        {track ?? <View style={styles.track} />}
        <Animated.View style={[styles.thumb, { backgroundColor: thumbColor }, thumbStyle]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: "center" },
  track: { height: 8, borderRadius: 999, backgroundColor: "rgba(142,83,120,0.18)" },
  thumb: {
    position: "absolute", left: 0, width: THUMB, height: THUMB, borderRadius: THUMB / 2,
    borderWidth: 2.5, borderColor: "#fff",
    shadowColor: "#5B2A4A", shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
});
