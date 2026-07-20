import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors, fonts } from "@/theme/tokens";

/** Back chevron + brandline, matching the web `.head`. Falls back to "/" if there's
 *  nothing to go back to (e.g. deep link). */
export function Header({ title }: { title: string }) {
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  return (
    <View style={styles.head}>
      <Pressable onPress={back} style={styles.back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={20} color={colors.plum} />
      </Pressable>
      <Text style={styles.brand}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 8 },
  back: {
    width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", borderWidth: 1, borderColor: colors.lineStrong,
  },
  brand: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.plum },
});
