import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { gradients } from "@/theme/tokens";

/** The ForHer screen shell: soft plum gradient background + safe area. Replaces the
 *  web `.fhTheme` wrapper. `scroll` toggles a ScrollView (default) vs a fixed View. */
export function Screen({ children, scroll = true, contentStyle }: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}) {
  return (
    <LinearGradient colors={gradients.bg} style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={["top", "left", "right"]}>
        {scroll ? (
          <ScrollView contentContainerStyle={[styles.body, contentStyle]} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { paddingBottom: 32 },
});
