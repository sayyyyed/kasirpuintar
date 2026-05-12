import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShoppingBag, Shield } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

/**
 * Entry Point — Auth & Role Redirect
 * In production, this will check auth state and redirect.
 * For now, it serves as a role-selection screen for demo purposes.
 */
export default function IndexScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"employee" | "admin" | null>(
    null
  );

  const handleContinue = () => {
    if (selectedRole === "employee") {
      router.replace("/(employee)/dashboard");
    } else if (selectedRole === "admin") {
      router.replace("/(admin)/analytics");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-8">
        {/* Decorative geometric shapes */}
        <View className="absolute top-16 right-[-40px] w-32 h-32 rounded-full bg-primary-100 opacity-40" />
        <View className="absolute bottom-32 left-[-20px] w-24 h-24 rounded-lg bg-secondary-100 opacity-40 rotate-45" />
        <View className="absolute top-40 left-8 w-16 h-16 rounded-full bg-accent-100 opacity-30" />

        {/* Logo & Title */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-lg bg-primary items-center justify-center mb-6">
            <ShoppingBag size={40} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text
            className="text-4xl text-foreground font-sans-extrabold"
            style={{ letterSpacing: -0.8 }}
          >
            KasirPuintar
          </Text>
          <Text className="text-base text-gray-500 font-sans mt-2">
            POS & Inventory Management
          </Text>
        </View>

        {/* Role Selection */}
        <Text className="text-sm font-sans-semibold text-gray-500 uppercase tracking-wider mb-4 text-center">
          Masuk Sebagai
        </Text>

        <View className="gap-3 mb-8">
          {/* Employee Card */}
          <Pressable
            className={`flex-row items-center p-5 rounded-lg ${
              selectedRole === "employee"
                ? "bg-primary-50 border-2 border-primary"
                : "bg-muted border-2 border-transparent"
            }`}
            onPress={() => setSelectedRole("employee")}
          >
            <View
              className={`w-14 h-14 rounded-full items-center justify-center ${
                selectedRole === "employee" ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <ShoppingBag
                size={24}
                color={selectedRole === "employee" ? "#FFFFFF" : Colors.gray[500]}
                strokeWidth={2}
              />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-sans-bold text-foreground">
                Karyawan
              </Text>
              <Text className="text-sm font-sans text-gray-500">
                Kasir, Shift & Inventori
              </Text>
            </View>
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selectedRole === "employee"
                  ? "border-primary bg-primary"
                  : "border-gray-300"
              }`}
            >
              {selectedRole === "employee" && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </Pressable>

          {/* Admin Card */}
          <Pressable
            className={`flex-row items-center p-5 rounded-lg ${
              selectedRole === "admin"
                ? "bg-secondary-50 border-2 border-secondary"
                : "bg-muted border-2 border-transparent"
            }`}
            onPress={() => setSelectedRole("admin")}
          >
            <View
              className={`w-14 h-14 rounded-full items-center justify-center ${
                selectedRole === "admin" ? "bg-secondary" : "bg-gray-200"
              }`}
            >
              <Shield
                size={24}
                color={selectedRole === "admin" ? "#FFFFFF" : Colors.gray[500]}
                strokeWidth={2}
              />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-sans-bold text-foreground">
                Pemilik
              </Text>
              <Text className="text-sm font-sans text-gray-500">
                Analitik, Staf & Produk
              </Text>
            </View>
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selectedRole === "admin"
                  ? "border-secondary bg-secondary"
                  : "border-gray-300"
              }`}
            >
              {selectedRole === "admin" && (
                <View className="w-2 h-2 rounded-full bg-white" />
              )}
            </View>
          </Pressable>
        </View>

        {/* Continue Button */}
        <Pressable
          className={`h-14 rounded-md items-center justify-center ${
            selectedRole ? "bg-primary" : "bg-gray-200"
          }`}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text
            className={`text-lg font-sans-bold ${
              selectedRole ? "text-white" : "text-gray-400"
            }`}
          >
            Lanjutkan
          </Text>
        </Pressable>

        {/* Login link */}
        <Pressable
          className="mt-6 items-center"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-sm font-sans-medium text-gray-500">
            Sudah punya akun?{" "}
            <Text className="text-primary font-sans-bold">Masuk</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
