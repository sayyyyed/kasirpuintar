import React from "react";
import { View } from "react-native";

type IconCircleColor = "primary" | "secondary" | "accent" | "danger" | "muted";
type IconCircleSize = "sm" | "md" | "lg";

interface IconCircleProps {
  children: React.ReactNode;
  color?: IconCircleColor;
  size?: IconCircleSize;
}

const colorClasses: Record<IconCircleColor, string> = {
  primary: "bg-kumo-info-tint",
  secondary: "bg-kumo-success-tint",
  accent: "bg-kumo-warning-tint",
  danger: "bg-kumo-danger-tint",
  muted: "bg-kumo-fill",
};

const sizeClasses: Record<IconCircleSize, string> = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-16 w-16",
};

export function IconCircle({
  children,
  color = "primary",
  size = "md",
}: IconCircleProps) {
  return (
    <View
      className={`items-center justify-center rounded-full ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      {children}
    </View>
  );
}

export default IconCircle;
