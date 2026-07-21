import { View, Image, StyleSheet } from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";

/** LifeSync+ lifestyle-care hero banner — real app art, 5-dot carousel indicator. */
export function LifeSyncBanner() {
  return (
    <>
      <PressableScale style={styles.card}>
        <Image
          source={require("../../../assets/home/lifesync-banner.png")}
          style={styles.img}
          resizeMode="cover"
        />
      </PressableScale>
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotOn]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14, marginTop: 12, borderRadius: 16, overflow: "hidden",
    shadowColor: "#1B2A3D", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    backgroundColor: "#EAF4FB",
  },
  img: { width: "100%", aspectRatio: 1113 / 390 },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", paddingTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#CBD3DE" },
  dotOn: { backgroundColor: "#3A4A61" },
});
