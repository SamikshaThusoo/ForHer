import { View, Text, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Circle, Path, Rect } from "react-native-svg";
import { fonts } from "@/theme/tokens";
import { hh } from "@/theme/habit";

/**
 * Habit Health lockup — "HABIT" in a heavy blue serif with the "A" replaced by a
 * stylised yoga figure (orange→coral gradient), "HEALTH" tracked wide below.
 * RN port of the web HabitHealthLogo (DM Serif Display stands in for Playfair).
 */
export function HabitHealthLogo() {
  return (
    <View style={styles.lockup}>
      <View style={styles.word}>
        <Text style={styles.letter}>H</Text>
        <Svg width={17} height={21} viewBox="0 0 100 120" style={styles.figureA}>
          <Defs>
            <LinearGradient id="habitA" x1="50%" y1="0%" x2="50%" y2="100%">
              <Stop offset="0%" stopColor="#F5A623" />
              <Stop offset="60%" stopColor="#F08144" />
              <Stop offset="100%" stopColor="#E94B3F" />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="16" r="10" fill="url(#habitA)" />
          <Path d="M 50 28 C 42 46, 32 78, 18 112 L 34 112 C 42 88, 48 68, 56 50 Z" fill="url(#habitA)" />
          <Path d="M 56 50 C 64 68, 70 88, 82 112 L 98 112 C 84 78, 74 46, 66 28 C 60 26, 55 26, 50 28 Z" fill="url(#habitA)" />
          <Rect x="36" y="78" width="32" height="7" rx="2.5" fill="url(#habitA)" />
        </Svg>
        <Text style={styles.letter}>BIT</Text>
      </View>
      <Text style={styles.sub}>HEALTH</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { alignItems: "center" },
  word: { flexDirection: "row", alignItems: "center" },
  letter: { fontFamily: fonts.serif, fontSize: 20, color: hh.blue, letterSpacing: 0.5, lineHeight: 22 },
  figureA: { marginHorizontal: -0.5 },
  sub: { fontFamily: fonts.sansBold, fontSize: 7.5, color: hh.blue, letterSpacing: 4.2, marginTop: 2, marginLeft: 4.2 },
});
