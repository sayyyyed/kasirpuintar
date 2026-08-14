import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from "@expo-google-fonts/outfit";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import "../global.css";
import { database, ensureTables } from "@/db";
import { startAutoSync, stopAutoSync, syncAll } from "@/services/sync";
import { PayrollProvider } from "@/hooks/usePayrollSettings";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      ensureTables()
        .then(() => syncAll())
        .catch(() => {})
        .finally(() => {
          startAutoSync();
          SplashScreen.hideAsync();
        });
    }
  }, [loaded]);

  useEffect(() => {
    return () => stopAutoSync();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <PayrollProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(employee)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </PayrollProvider>
  );
}
