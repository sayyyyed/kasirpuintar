import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ChevronUp, ChevronDown } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

// Tinggi sheet saat ringkas (belum di-drag ke atas). Sisanya jadi ruang
// untuk drag ke fullscreen.
const COLLAPSED_RATIO = 0.68;

export default function SheetModal({ visible, title, onClose, children }: Props) {
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Batas aman: jangan pernah menyentuh area status bar (atas) maupun
  // home indicator / gesture swipe (bawah).
  const topInset = Math.max(insets.top, 12);
  const bottomInset = Math.max(insets.bottom, 16);
  const collapsedHeight = Math.round(screenH * COLLAPSED_RATIO);
  const expandedHeight = screenH - topInset;

  const translateY = useRef(new Animated.Value(screenH)).current;
  const sheetHeight = useRef(new Animated.Value(collapsedHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [show, setShow] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const expandedRef = useRef(false);

  const heightsRef = useRef({ collapsedHeight, expandedHeight });
  heightsRef.current = { collapsedHeight, expandedHeight };

  const animateTo = React.useCallback(
    (next: boolean) => {
      expandedRef.current = next;
      setExpanded(next);
      const target = next
        ? heightsRef.current.expandedHeight
        : heightsRef.current.collapsedHeight;
      Animated.parallel([
        Animated.timing(sheetHeight, {
          toValue: target,
          duration: 220,
          useNativeDriver: false,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 20,
          bounciness: 0,
          useNativeDriver: false,
        }),
      ]).start();
    },
    [sheetHeight, translateY],
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
        onPanResponderMove: (_, gesture) => {
          // Tarik ke bawah untuk menutup/mengecil. Tarik ke atas memberi
          // sedikit feedback (naik maks 24px) lalu fullscreen saat release.
          translateY.setValue(Math.max(-24, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -60 || gesture.vy < -0.8) {
            animateTo(true);
            return;
          }

          if (gesture.dy > 110 || gesture.vy > 1.2) {
            if (expandedRef.current) {
              animateTo(false);
            } else {
              onClose();
            }
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            speed: 20,
            bounciness: 0,
            useNativeDriver: false,
          }).start();
        },
      }),
    [animateTo, onClose, translateY],
  );

  useEffect(() => {
    if (visible) {
      expandedRef.current = false;
      setExpanded(false);
      sheetHeight.setValue(collapsedHeight);
      translateY.setValue(screenH);
      setShow(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          speed: 14,
          bounciness: 2,
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (show) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenH,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => setShow(false));
    }
  }, [visible]);

  if (!show) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}>
        <Pressable style={{ position: "absolute", inset: 0 }} onPress={onClose}>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              opacity: overlayOpacity,
            }}
          />
        </Pressable>

        <Animated.View
          style={{
            transform: [{ translateY }],
            maxHeight: sheetHeight,
            width: "100%",
            maxWidth: 720,
            alignSelf: "center",
            backgroundColor: Colors.base,
            overflow: "hidden",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderTopWidth: 1,
            borderTopColor: Colors.kumo.hairline,
          }}
        >
          {/* Drag handle */}
          <View
            {...panResponder.panHandlers}
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 6 }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: expanded ? Colors.kumo.brand : Colors.kumo.fill,
              }}
            />
          </View>

          {/* Header */}
          <View
            {...panResponder.panHandlers}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingTop: 4,
              paddingBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 6,
                  height: 28,
                  borderRadius: 3,
                  backgroundColor: Colors.kumo.brand,
                }}
              />
              <Text
                className="text-xl font-sans-semibold text-kumo-default"
                numberOfLines={1}
              >
                {title}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={expanded ? "Perkecil" : "Perbesar"}
                onPress={() => animateTo(!expandedRef.current)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: Colors.kumo.tint,
                  borderWidth: 1,
                  borderColor: Colors.kumo.hairline,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {expanded ? (
                  <ChevronDown size={20} color={Colors.gray[500]} strokeWidth={2.5} />
                ) : (
                  <ChevronUp size={20} color={Colors.gray[500]} strokeWidth={2.5} />
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                onPress={onClose}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: Colors.kumo.tint,
                  borderWidth: 1,
                  borderColor: Colors.kumo.hairline,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color={Colors.gray[500]} strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Content (bounded agar bisa di-scroll & tidak menutupi area swipe) */}
          <View
            style={{
              flexShrink: 1,
              paddingHorizontal: 24,
              paddingBottom: bottomInset + 8,
            }}
          >
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
