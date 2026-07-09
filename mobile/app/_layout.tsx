import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { hydrateStorage } from "@/lib/storage";
import { PersonaProvider } from "@/context/PersonaContext";
import { colors } from "@/theme/tokens";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  // Hydrate the sync storage cache from AsyncStorage before rendering, so the ported
  // logic layer (which reads storage synchronously) sees persisted data on first paint.
  useEffect(() => {
    hydrateStorage().then(() => setReady(true));
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bgTop }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersonaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgTop } }} />
        </PersonaProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
