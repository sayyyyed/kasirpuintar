import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/Colors";

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading, redirectPath } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user && redirectPath) {
        router.replace(redirectPath as any);
      } else if (!user) {
        router.replace("/(auth)/login");
      }
    }
  }, [isLoading, user]);

  return (
    <View className="flex-1 bg-primary items-center justify-center">
      <View className="absolute top-20 right-0 w-40 h-40 rounded-full bg-white opacity-5 -translate-x-10" />
      <View className="absolute bottom-32 left-0 w-28 h-28 rounded-lg bg-white opacity-5 translate-x-5 rotate-45" />
      <View className="items-center">
        <Text
          className="text-5xl font-sans-extrabold text-white mb-4"
          style={{ letterSpacing: -1.5 }}
        >
          Kasir
        </Text>
        <Text
          className="text-4xl font-sans-extrabold text-white opacity-80 mb-12"
          style={{ letterSpacing: -1 }}
        >
          Puintar
        </Text>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="text-sm font-sans-medium text-white opacity-60 mt-6">
          Memuat...
        </Text>
      </View>
    </View>
  );
}
