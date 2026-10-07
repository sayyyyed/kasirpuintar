import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileX, Home } from "lucide-react-native";

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-kumo-base">
      <Stack.Screen options={{ title: "Halaman Tidak Ditemukan" }} />

      <View className="flex-1 items-center justify-center px-8">
        {/* Decorative shapes */}
        <View className="absolute top-20 right-[-30px] w-32 h-32 rounded-full bg-kumo-info-tint opacity-40" />
        <View className="absolute bottom-40 left-[-20px] w-24 h-24 rounded-lg bg-kumo-success-tint opacity-40 rotate-12" />

        {/* Icon */}
        <View className="w-24 h-24 rounded-full bg-kumo-fill items-center justify-center mb-6">
          <FileX size={48} color="#9CA3AF" strokeWidth={2} />
        </View>

        {/* Title */}
        <Text
          className="text-3xl text-kumo-default font-sans-semibold text-center"

        >
          Oops!
        </Text>

        <Text className="text-base text-kumo-subtle font-sans text-center mt-2">
          Halaman yang Anda cari tidak ditemukan.
        </Text>

        {/* Back to Home Button */}
        <Link href="/" asChild>
          <View className="mt-8 h-14 px-8 rounded-md bg-kumo-brand items-center justify-center flex-row">
            <Home size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="ml-2 text-lg font-sans-semibold text-kumo-inverse">
              Kembali ke Beranda
            </Text>
          </View>
        </Link>
      </View>
    </SafeAreaView>
  );
}
