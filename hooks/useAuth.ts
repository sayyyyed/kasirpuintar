import { useEffect, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/services/supabase";
import { signInWithPin } from "@/services/auth";
import { syncAllDetailed } from "@/services/sync";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "cashier";
};

const SESSION_KEY = "user_session_v2";

function redirectFor(user: AuthUser | null): string | null {
  if (user?.role === "owner") return "/(admin)/analytics";
  if (user?.role === "cashier") return "/(employee)/dashboard";
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    checkPersistedSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Token/Session expired → otomatis logout
      if (event === "SIGNED_OUT" || (!session && userRef.current)) {
        setUser(null);
        AsyncStorage.removeItem(SESSION_KEY);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const checkPersistedSession = async () => {
    try {
      const saved = await AsyncStorage.getItem(SESSION_KEY);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (pin: string) => {
    const { data, error } = await signInWithPin(pin);
    if (error || !data?.user) {
      return { error };
    }

    // Kegagalan push (upload) tidak menghalangi login; hanya kegagalan pull
    // (unduh data) yang dianggap fatal karena data lokal belum lengkap.
    const { pullFailed } = await syncAllDetailed();
    if (pullFailed > 0) {
      return {
        data: null,
        error: new Error(
          "Login berhasil, tetapi data belum selesai diunduh. Periksa koneksi lalu coba lagi."
        ),
      };
    }

    const sessionData = { ...data.user };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setUser(sessionData);
    return { error: null, redirectPath: redirectFor(sessionData) };
  }, []);

  const signOut = useCallback(async () => {
    if (userRef.current?.role === "owner") {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const redirectPath = redirectFor(user);

  return { user, isLoading, login, signOut, redirectPath };
}
