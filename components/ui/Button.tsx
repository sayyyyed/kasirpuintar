import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost"
  | "ghostDanger";
type ButtonSize = "sm" | "md" | "icon" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
  textClassName?: string;
}

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: "bg-kumo-brand shadow-kumo-primary",
    text: "text-kumo-inverse font-sans-medium",
  },
  secondary: {
    container: "bg-kumo-base shadow-kumo",
    text: "text-kumo-default font-sans-medium",
  },
  outline: {
    container: "bg-transparent border border-kumo-line",
    text: "text-kumo-default font-sans-medium",
  },
  danger: {
    container: "bg-kumo-danger shadow-kumo",
    text: "text-kumo-inverse font-sans-medium",
  },
  ghost: {
    container: "bg-transparent active:bg-kumo-fill-hover",
    text: "text-kumo-subtle font-sans-medium",
  },
  ghostDanger: {
    container: "bg-transparent active:bg-kumo-danger-tint",
    text: "text-kumo-subtle font-sans-medium",
  },
};

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "h-8 px-3", text: "text-xs" },
  md: { container: "h-9 px-4", text: "text-sm" },
  icon: { container: "size-9 p-0", text: "text-sm" },
  lg: { container: "h-10 px-5", text: "text-sm" },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  loading = false,
  textClassName,
  disabled,
  onPressIn,
  onPressOut,
  className,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={animatedStyle}
      className={`
        relative overflow-hidden flex-row items-center justify-center rounded-lg
        ${variantClasses[variant].container}
        ${sizeClasses[size].container}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 shadow-none" : ""}
        ${className ?? ""}
      `}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPressIn={(event) => {
        scale.value = withTiming(0.97, { duration: 100 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 100 });
        onPressOut?.(event);
      }}
      {...props}
    >
      {variant === "primary" || variant === "secondary" || variant === "danger" ? (
        <View className="pointer-events-none absolute inset-0 bg-white opacity-[0.08]" />
      ) : null}
      <View className="relative flex-row items-center justify-center gap-2">
        {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : icon}
        {typeof children === "string" ? (
          <Text
            className={`${variantClasses[variant].text} ${sizeClasses[size].text} ${textClassName ?? ""}`}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </AnimatedPressable>
  );
}

export default Button;
