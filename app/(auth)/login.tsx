import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
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
const MIN_PIN_LENGTH = BOX_COUNT;

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
  const { login } = useAuth();
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
    if (pin.length < MIN_PIN_LENGTH) return;

    if (pin.length === BOX_COUNT) {
      submittingRef.current = true;
      submitPin(pin);
    }
  };

  const submitPin = async (pin: string) => {
    if (pin.length < MIN_PIN_LENGTH || isLoading) return;
    submittingRef.current = true;
    setErrorMsg("");
    setIsLoading(true);
    const { error, redirectPath: target } = await login(pin);
    setIsLoading(false);
    if (error) {
      setErrorMsg(error.message || "PIN salah");
      setRawInput("");
      setDigits(Array(BOX_COUNT).fill(""));
      submittingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    } else if (target) {
      router.replace(target as any);
    }
  };

  const rawPin = digits.filter((d) => d !== "").join("");

  const pinReady = rawPin.length >= MIN_PIN_LENGTH;
  const buttonBg = isLoading
    ? "#005EE6"
    : pinReady
    ? Colors.primary.DEFAULT
    : "#F3F3F3";
  const showButtonShadow = pinReady || isLoading;

  return (
    <SafeAreaView className="flex-1 bg-kumo-recessed">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable className="flex-1 items-center justify-center px-4 py-8" onPress={() => inputRef.current?.focus()}>
          <View className="w-full max-w-sm">
          {/* Logo */}
          <View className="items-center mb-6">
            <Image
              source={require("@/assets/images/logowarung.png")}
              style={{ width: 64, height: 64, borderRadius: 8 }}
              resizeMode="contain"
            />
            <Text className="text-lg text-kumo-strong font-sans mt-3">
              KasirPuintar
            </Text>
            <Text className="text-sm text-kumo-subtle font-sans mt-1">
              Masukkan PIN untuk melanjutkan
            </Text>
          </View>

          <View className="rounded-lg bg-kumo-base p-6 shadow-kumo">
          {/* PIN Boxes */}
          <View
            className="flex-row justify-center gap-3 mb-8"
          >
            {digits.map((digit, i) => (
              <View
                key={i}
                className={`w-12 h-12 rounded-lg items-center justify-center border ${
                  digit !== ""
                    ? "border-kumo-brand bg-kumo-info-tint"
                    : errorMsg !== ""
                    ? "border-kumo-danger bg-kumo-danger-tint"
                    : i === digits.findIndex((d) => d === "")
                    ? "border-kumo-brand bg-kumo-base"
                    : "border-kumo-line bg-kumo-fill"
                }`}
              >
                <Text className="text-xl font-sans-semibold text-kumo-default">
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
            <Text className="text-sm text-kumo-danger font-sans-medium text-center mb-6">
              {errorMsg}
            </Text>
          )}

          {/* Confirm Button */}
          <Pressable
            className="h-14 rounded-lg items-center justify-center flex-row"
            style={[
              { backgroundColor: buttonBg },
              showButtonShadow
                ? {
                    borderWidth: 1,
                    borderColor: "#1741B8",
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 2,
                  }
                : null,
            ]}
            onPress={() => submitPin(rawPin)}
            disabled={!pinReady || isLoading}
            accessibilityRole="button"
            accessibilityState={{ disabled: !pinReady || isLoading, busy: isLoading }}
          >
            {isLoading && <ActivityIndicator color="#FFFFFF" size="small" />}
            <Text
              className={`text-base font-sans-semibold ${isLoading ? "ml-2" : ""} ${
                rawPin.length >= MIN_PIN_LENGTH || isLoading ? "text-kumo-inverse" : "text-kumo-subtle"
              }`}
            >
              {isLoading ? "Memeriksa..." : "Masuk"}
            </Text>
          </Pressable>

          </View>

          <Text className="text-xs font-sans text-kumo-subtle text-center mt-5">
            PIN dibuat oleh pemilik toko
          </Text>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
