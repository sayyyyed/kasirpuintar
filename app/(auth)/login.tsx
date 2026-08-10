import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";

const BOX_COUNT = 6;

function parseDigits(text: string): string[] {
  const nums = text.replace(/[^0-9]/g, "").split("").slice(0, BOX_COUNT);
  const filled = Array(BOX_COUNT).fill("");
  nums.forEach((d, i) => {
    filled[i] = d;
  });
  return filled;
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, redirectPath } = useAuth();
  const [rawInput, setRawInput] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(BOX_COUNT).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<RNTextInput>(null);

  const submittingRef = useRef(false);

  const handleChangeText = (text: string) => {
    if (submittingRef.current) return;
    const parsed = parseDigits(text);
    setRawInput(text);
    setDigits(parsed);

    const pin = parsed.filter((d) => d !== "").join("");
    if (pin.length < 6) return;

    const firstEmpty = parsed.findIndex((d) => d === "");
    const consecutive = firstEmpty === -1 || firstEmpty >= pin.length;

    if (consecutive) {
      submittingRef.current = true;
      submitPin(pin);
    }
  };

  const submitPin = async (pin: string) => {
    if (pin.length < 6) return;
    setErrorMsg("");
    setIsLoading(true);
    const { error } = await login(pin);
    setIsLoading(false);
    if (error) {
      setErrorMsg(error.message || "PIN salah");
      setRawInput("");
      setDigits(Array(BOX_COUNT).fill(""));
      submittingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (redirectPath) {
      router.replace(redirectPath as any);
    }
  };

  const rawPin = digits.filter((d) => d !== "").join("");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable className="flex-1 justify-center px-8" onPress={() => inputRef.current?.focus()}>
          {/* Decorative shapes */}
          <View className="absolute top-16 right-[-40px] w-32 h-32 rounded-full bg-primary-100 opacity-40" />
          <View className="absolute top-40 left-[-20px] w-20 h-20 rounded-lg bg-secondary-100 opacity-40 rotate-45" />
          <View className="absolute bottom-32 left-8 w-16 h-16 rounded-full bg-accent-100 opacity-30" />

          {/* Logo */}
          <View className="items-center mb-10">
            <Image
              source={require("@/assets/images/logowarung.png")}
              style={{ width: 96, height: 96, borderRadius: 16 }}
              resizeMode="contain"
            />
            <View style={{ height: 24 }} />
            <Text
              className="text-4xl text-foreground font-sans-extrabold"
              style={{ letterSpacing: -0.8 }}
            >
              KasirPuintar
            </Text>
            <Text className="text-base text-gray-500 font-sans mt-2">
              Masukkan PIN untuk melanjutkan
            </Text>
          </View>

          {/* PIN Boxes */}
          <View
            className="flex-row justify-center gap-3 mb-8"
          >
            {digits.map((digit, i) => (
              <View
                key={i}
                className={`w-14 h-16 rounded-lg items-center justify-center border-2 transition-all duration-200 ${
                  digit !== ""
                    ? "border-primary bg-primary-50"
                    : errorMsg !== ""
                    ? "border-red-400 bg-red-50"
                    : i === digits.findIndex((d) => d === "")
                    ? "border-primary-300 bg-white"
                    : "border-muted bg-muted"
                }`}
              >
                <Text className="text-2xl font-sans-extrabold text-foreground">
                  {digit !== "" ? "●" : ""}
                </Text>
              </View>
            ))}
          </View>

          {/* Hidden input to capture keystrokes */}
          <RNTextInput
            ref={inputRef}
            value={rawInput}
            onChangeText={handleChangeText}
            keyboardType="number-pad"
            maxLength={BOX_COUNT}
            autoFocus
            className="absolute opacity-0 h-0 w-0"
          />

          {/* Error */}
          {errorMsg !== "" && (
            <Text className="text-sm text-red-500 font-sans-medium text-center mb-6">
              {errorMsg}
            </Text>
          )}

          {/* Confirm Button */}
          <Pressable
            className={`h-14 rounded-md items-center justify-center transition-all duration-200 ${
              rawPin.length >= 6 && !isLoading
                ? "bg-primary active:bg-primary-600"
                : "bg-gray-200"
            }`}
            onPress={() => submitPin(rawPin)}
            disabled={rawPin.length < 6 || isLoading}
          >
            <Text
              className={`text-lg font-sans-bold ${
                rawPin.length >= 6 ? "text-white" : "text-gray-400"
              }`}
            >
              {isLoading ? "Memeriksa..." : "Masuk"}
            </Text>
          </Pressable>

          <Text className="text-xs font-sans text-gray-400 text-center mt-6">
            PIN dibuat oleh pemilik toko
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
