import React, { useEffect, useRef } from "react";
import { Modal, View, Text, Pressable, Animated, Dimensions } from "react-native";
import { X } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

const { height: SCREEN_H } = Dimensions.get("window");

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function SheetModal({ visible, title, onClose, children }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [show, setShow] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          speed: 14,
          bounciness: 2,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (show) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShow(false));
    }
  }, [visible]);

  if (!show) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0" onPress={onClose}>
          <Animated.View className="flex-1 bg-black/40" style={{ opacity: overlayOpacity }} />
        </Pressable>

        <Animated.View
          className="bg-white rounded-t-2xl"
          style={{
            transform: [{ translateY }],
            maxHeight: SCREEN_H * 0.88,
          }}
        >
          {/* Decorative bar */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-muted" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
            <View className="flex-row items-center gap-3">
              <View className="w-1.5 h-7 bg-primary rounded-full" />
              <Text
                className="text-xl font-sans-extrabold text-foreground"
                style={{ letterSpacing: -0.5 }}
              >
                {title}
              </Text>
            </View>
            <Pressable
              className="w-10 h-10 rounded-lg bg-muted items-center justify-center"
              onPress={onClose}
            >
              <X size={20} color={Colors.gray[500]} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Content */}
          <View className="px-6 pb-8">{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}
