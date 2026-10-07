import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

type ToastProps = {
  visible: boolean;
  message: string;
  onDismiss?: () => void;
  tone?: "info" | "success" | "error";
};

const tones = {
  info: { background: "#2563EB", text: "#FAFAFA" },
  success: { background: "#047857", text: "#FAFAFA" },
  error: { background: "#B91C1C", text: "#FAFAFA" },
} as const;

export function Toast({ visible, message, onDismiss, tone = "info" }: ToastProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const colors = tones[tone];
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 16) + 12,
        zIndex: 1000,
        elevation: 8,
      }}
    >
      <View
        accessibilityRole="alert"
        style={{
          minHeight: 52,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.background,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: "#000000",
          shadowOpacity: 0.12,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      >
        <Text style={{ flex: 1, color: colors.text, fontWeight: "600" }}>
          {message}
        </Text>
        {onDismiss && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tutup notifikasi"
            onPress={onDismiss}
            hitSlop={8}
            style={{ marginLeft: 12 }}
          >
            <X size={18} color={colors.text} strokeWidth={2.5} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default Toast;
