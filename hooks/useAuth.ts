import { useEffect, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { supabase } from "@/services/supabase";
import { signInWithPin } from "@/services/auth";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "cashier";
};

const SESSION_KEY = "user_session_v2";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
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
        router.replace("/(auth)/login");
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
    const sessionData = { ...data.user };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setUser(sessionData);
    return { error: null };
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

  const redirectPath =
    user?.role === "owner"
      ? "/(admin)/analytics"
      : user?.role === "cashier"
      ? "/(employee)/dashboard"
      : null;

  return { user, isLoading, login, signOut, redirectPath };
}
