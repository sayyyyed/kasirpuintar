import React, { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, Eye, EyeOff, ShoppingBag } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/Colors";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // TODO: Supabase auth
    setTimeout(() => {
      setIsLoading(false);
      router.replace("/(employee)/dashboard");
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Decorative shapes */}
          <View className="absolute top-8 right-[-30px] w-28 h-28 rounded-full bg-primary-100 opacity-30" />
          <View className="absolute bottom-20 left-[-20px] w-20 h-20 rounded-lg bg-accent-100 opacity-30 rotate-12" />

          {/* Logo */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-lg bg-primary items-center justify-center mb-4">
              <ShoppingBag size={32} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <Text
              className="text-3xl text-foreground font-sans-extrabold"
              style={{ letterSpacing: -0.6 }}
            >
              Masuk
            </Text>
            <Text className="text-sm text-gray-500 font-sans mt-1">
              Masukkan kredensial Anda
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4 mb-8">
            <Input
              label="Email"
              placeholder="nama@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={20} color={Colors.gray[400]} strokeWidth={2} />}
            />

            <View>
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                icon={<Lock size={20} color={Colors.gray[400]} strokeWidth={2} />}
              />
              <Pressable
                className="absolute right-4 bottom-4"
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.gray[400]} />
                ) : (
                  <Eye size={20} color={Colors.gray[400]} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            className={`h-14 rounded-md items-center justify-center ${
              isLoading ? "bg-primary-600" : "bg-primary"
            }`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-lg font-sans-bold text-white">
              {isLoading ? "Memuat..." : "Masuk"}
            </Text>
          </Pressable>

          {/* Footer */}
          <Pressable className="mt-6 items-center" onPress={() => router.back()}>
            <Text className="text-sm font-sans-medium text-gray-500">
              Kembali ke{" "}
              <Text className="text-primary font-sans-bold">Pilih Role</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
