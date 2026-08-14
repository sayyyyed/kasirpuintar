import React, { useRef, useState, useMemo } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BarChart3,
  Users,
  Package,
  Settings,
  DollarSign,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { usePayrollSettings } from "@/hooks/usePayrollSettings";
import Analytics from "./analytics";
import Employees from "./employees";
import Products from "./products";
import SettingsScreen from "./settings";
import PayrollScreen from "./payroll";

const TABS = [
  { key: "analytics", label: "Analitik", icon: BarChart3 },
  { key: "employees", label: "Staf", icon: Users },
  { key: "products", label: "Produk", icon: Package },
  { key: "payroll", label: "Gaji", icon: DollarSign },
  { key: "settings", label: "Atur", icon: Settings },
];

const PAGE_COUNT = TABS.length;

export default function AdminLayout() {
  const pagerRef = useRef<PagerView>(null);
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goTo = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  const tabWidth = 100 / PAGE_COUNT;

  const indicatorLeft = useMemo(
    () =>
      scrollX.interpolate({
        inputRange: TABS.map((_, i) => i),
        outputRange: TABS.map((_, i) => `${tabWidth * i}%`),
      }),
    [scrollX, tabWidth]
  );

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
        <View key="payroll" className="flex-1">
          <PayrollScreen />
        </View>
        <View key="settings" className="flex-1">
          <SettingsScreen />
        </View>
      </PagerView>

      <View
        className="bg-white border-t-2 border-muted items-center"
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <View className="w-full" style={{ maxWidth: 500 }}>
        <View className="flex-row relative pt-2 pb-1">
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
                className="flex-1 items-center justify-center py-2"
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
    </View>
  );
}
