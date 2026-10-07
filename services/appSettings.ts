import AsyncStorage from "@react-native-async-storage/async-storage";

const APP_SETTINGS_KEY = "app_settings";

export type AppSettings = {
  storeName: string;
  showCashierName: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  storeName: "KasirPuintar",
  showCashierName: true,
};

export async function getAppSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(APP_SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      storeName: typeof parsed.storeName === "string" && parsed.storeName.trim()
        ? parsed.storeName
        : DEFAULT_SETTINGS.storeName,
      showCashierName: parsed.showCashierName !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveAppSettings(settings: AppSettings) {
  await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
}
