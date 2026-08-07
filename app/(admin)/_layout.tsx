import React, { useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BarChart3,
  Users,
  Package,
  Settings,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import Analytics from "./analytics";
import Employees from "./employees";
import Products from "./products";
import SettingsScreen from "./settings";

const TABS = [
  { key: "analytics", label: "Analitik", icon: BarChart3 },
  { key: "employees", label: "Staf", icon: Users },
  { key: "products", label: "Produk", icon: Package },
  { key: "settings", label: "Atur", icon: Settings },
];

export default function AdminLayout() {
  const pagerRef = useRef<PagerView>(null);
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goTo = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const tabWidth = 100 / TABS.length;

  const indicatorLeft = scrollX.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, tabWidth * 1, tabWidth * 2, tabWidth * 3].map(
      (v) => `${v}%`
    ),
  });

  return (
    <View className="flex-1 bg-white">
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageScroll={(e) => {
          const offset = e.nativeEvent.offset;
          const pos = e.nativeEvent.position;
          scrollX.setValue(pos + offset);
        }}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        <View key="analytics" className="flex-1">
          <Analytics />
        </View>
        <View key="employees" className="flex-1">
          <Employees />
        </View>
        <View key="products" className="flex-1">
          <Products />
        </View>
        <View key="settings" className="flex-1">
          <SettingsScreen />
        </View>
      </PagerView>

      <View
        className="bg-white border-t-2 border-muted"
        style={{
          paddingBottom: 24 + insets.bottom,
          paddingTop: 10,
          height: 76 + insets.bottom,
        }}
      >
        <View className="flex-row relative">
          <Animated.View
            className="absolute top-0 h-1 bg-primary rounded-full"
            style={{
              left: indicatorLeft,
              width: `${tabWidth}%`,
            }}
          />

          {TABS.map((tab, i) => {
            const active = i === page;
            const Icon = tab.icon;
            return (
              <Pressable
                key={tab.key}
                className="flex-1 items-center justify-center"
                onPress={() => goTo(i)}
              >
                <Icon
                  size={22}
                  color={active ? Colors.primary.DEFAULT : Colors.gray[400]}
                  strokeWidth={2}
                />
                <Text
                  className={`text-[10px] mt-1 ${
                    active
                      ? "text-primary font-sans-bold"
                      : "text-gray-400 font-sans-medium"
                  }`}
                  style={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
