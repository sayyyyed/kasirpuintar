import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </View>
    );
  }

  return null;
}
