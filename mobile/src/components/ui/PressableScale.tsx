import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, useReducedMotion } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A Pressable with a native press-scale (Reanimated). Drop-in replacement for the
 *  interactive surfaces across the app; respects the OS reduce-motion setting. */
export function PressableScale({
  children, style, scaleTo = 0.96, ...props
}: Omit<PressableProps, "style"> & { style?: StyleProp<ViewStyle>; scaleTo?: number }) {
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => { if (!reduce) s.value = withTiming(scaleTo, { duration: 90 }); props.onPressIn?.(e); }}
      onPressOut={(e) => { if (!reduce) s.value = withSpring(1, { stiffness: 320, damping: 18 }); props.onPressOut?.(e); }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}
