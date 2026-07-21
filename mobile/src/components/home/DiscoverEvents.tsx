import { View, Text, ScrollView, Image, StyleSheet, Dimensions, type ImageSourcePropType } from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { hh } from "@/theme/habit";
import { fonts } from "@/theme/tokens";

// Explicit pixel sizing — see LifeSyncBanner; intrinsic-size rendering zoomed the art.
const CARD_W = Math.round(Dimensions.get("window").width * 0.72);
const IMG_H = Math.round(CARD_W * (512 / 910));

const EVENTS: { source: ImageSourcePropType; title: string }[] = [
  { source: require("../../../assets/home/event-tone-arms.png"), title: "Tone Your Arms" },
  { source: require("../../../assets/home/event-core.png"), title: "Core & Flexibility" },
  { source: require("../../../assets/home/event-stretch.png"), title: "Full Body Stretch" },
];

/** "Discover Events" — horizontal rail of workout-video cards, matching the
 *  real app. Stills lifted from the app's event thumbnails. */
export function DiscoverEvents() {
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.title}>Discover Events</Text>
        <Text style={styles.seeAll}>See all</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {EVENTS.map((ev) => (
          <PressableScale key={ev.title} style={styles.card}>
            <Image source={ev.source} style={styles.img} resizeMode="cover" />
            <Text style={styles.cardTitle}>{ev.title}</Text>
          </PressableScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginTop: 26 },
  title: { fontSize: 17, fontFamily: fonts.sansBold, color: hh.text },
  seeAll: { fontSize: 13, fontFamily: fonts.sansBold, color: hh.blue },
  rail: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6, gap: 12 },
  card: {
    width: CARD_W, borderRadius: 16, backgroundColor: hh.surface, overflow: "hidden",
    shadowColor: "#1B2A3D", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  img: { width: CARD_W, height: IMG_H },
  cardTitle: { fontSize: 13.5, fontFamily: fonts.sansBold, color: hh.text, paddingHorizontal: 12, paddingVertical: 11 },
});
