import React from "react";
import { Pressable, View, type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardColor = "white" | "blue" | "green" | "amber" | "muted";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  color?: CardColor;
  onPress?: () => void;
  interactive?: boolean;
}

const colorClasses: Record<CardColor, string> = {
  white: "bg-kumo-base shadow-kumo",
  blue: "bg-kumo-info-tint shadow-kumo",
  green: "bg-kumo-success-tint shadow-kumo",
  amber: "bg-kumo-warning-tint shadow-kumo",
  muted: "bg-kumo-tint",
};

export function Card({
  children,
  color = "white",
  onPress,
  interactive = false,
  className: extraClass,
  ...props
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (onPress || interactive) {
    return (
      <AnimatedPressable
        style={animatedStyle}
        className={`rounded-lg p-5 ${colorClasses[color]} ${extraClass ?? ""}`}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      className={`rounded-lg p-5 ${colorClasses[color]} ${extraClass ?? ""}`}
      {...props}
    >
      {children}
    </View>
  );
}

export default Card;
