import React from "react";
import { View, Text } from "react-native";

type BadgeVariant = "primary" | "secondary" | "accent" | "danger" | "muted";

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: "bg-kumo-info-tint", text: "text-info" },
  secondary: { bg: "bg-kumo-success-tint", text: "text-kumo-success" },
  accent: { bg: "bg-kumo-warning-tint", text: "text-kumo-warning" },
  danger: { bg: "bg-kumo-danger-tint", text: "text-kumo-danger" },
  muted: { bg: "bg-kumo-fill", text: "text-kumo-subtle" },
};

export function Badge({ children, variant = "primary" }: BadgeProps) {
  return (
    <View
      className={`px-3 py-1 rounded-full ${variantClasses[variant].bg}`}
    >
      <Text
        className={`text-xs font-sans-medium ${variantClasses[variant].text}`}
      >
        {children}
      </Text>
    </View>
  );
}

export default Badge;
