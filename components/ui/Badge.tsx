import React from "react";
import { View, Text } from "react-native";

type BadgeVariant = "primary" | "secondary" | "accent" | "danger" | "muted";

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: "bg-primary-100", text: "text-primary-700" },
  secondary: { bg: "bg-secondary-100", text: "text-secondary-600" },
  accent: { bg: "bg-accent-100", text: "text-accent-600" },
  danger: { bg: "bg-red-100", text: "text-red-700" },
  muted: { bg: "bg-gray-200", text: "text-gray-700" },
};

export function Badge({ children, variant = "primary" }: BadgeProps) {
  return (
    <View
      className={`px-3 py-1 rounded-full ${variantClasses[variant].bg}`}
    >
      <Text
        className={`text-xs font-sans-semibold uppercase tracking-wider ${variantClasses[variant].text}`}
      >
        {children}
      </Text>
    </View>
  );
}

export default Badge;
