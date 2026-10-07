import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

const authStorage = {
  getItem: (key: string) =>
    typeof window === "undefined" ? Promise.resolve(null) : AsyncStorage.getItem(key),
  setItem: (key: string, value: string) =>
    typeof window === "undefined"
      ? Promise.resolve()
      : AsyncStorage.setItem(key, value),
  removeItem: (key: string) =>
    typeof window === "undefined"
      ? Promise.resolve()
      : AsyncStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

let sessionPromise: Promise<void> | null = null;

/**
 * Memastikan ada sesi Supabase (owner login atau anonim) agar engine
 * sinkronisasi bisa push/pull untuk semua role, termasuk kasir yang
 * login lokal via PIN. Best-effort: tidak melempar error ke caller.
 */
export async function ensureSession(): Promise<void> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return;
      try {
        await supabase.auth.signInAnonymously();
      } catch {
        // anon sign-in tidak diaktifkan — sync akan berjalan tanpa sesi
      }
    })();
  }
  try {
    await sessionPromise;
  } catch {
    // abaikan — sync bersifat best-effort
  } finally {
    sessionPromise = null;
  }
}
