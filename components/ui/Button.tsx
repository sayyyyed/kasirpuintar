import React from "react";
import { Pressable, Text, type PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: "bg-primary",
    text: "text-white font-sans-semibold",
  },
  secondary: {
    container: "bg-muted",
    text: "text-foreground font-sans-semibold",
  },
  outline: {
    container: "bg-transparent border-4 border-primary",
    text: "text-primary font-sans-semibold",
  },
  danger: {
    container: "bg-red-500",
    text: "text-white font-sans-semibold",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-foreground font-sans-medium",
  },
};

const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "h-10 px-4", text: "text-sm" },
  md: { container: "h-12 px-6", text: "text-base" },
  lg: { container: "h-14 px-8", text: "text-lg" },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  disabled,
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
        flex-row items-center justify-center rounded-md
        ${variantClasses[variant].container}
        ${sizeClasses[size].container}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50" : ""}
      `}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      {...props}
    >
      {icon && <>{icon}</>}
      <Text
        className={`
          ${variantClasses[variant].text}
          ${sizeClasses[size].text}
          ${icon ? "ml-2" : ""}
        `}
      >
        {children}
      </Text>
    </AnimatedPressable>
  );
}

export default Button;
