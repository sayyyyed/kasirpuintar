import React, { useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import PagerView from "@/components/PagerView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Clock,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { EmployeeTabContext } from "@/hooks/useEmployeeTab";
import Dashboard from "./dashboard";
import POSScreen from "./pos";
import Inventory from "./inventory";
import History from "./history";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "pos", label: "Kasir", icon: ShoppingCart },
  { key: "inventory", label: "Stok", icon: Package },
  { key: "history", label: "Riwayat", icon: Clock },
];

export default function EmployeeLayout() {
  const pagerRef = useRef<any>(null);
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
    <EmployeeTabContext.Provider value={{ goTo }}>
      <View className="flex-1 bg-kumo-canvas">
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
        <View key="dashboard" className="flex-1">
          <Dashboard />
        </View>
        <View key="pos" className="flex-1">
          <POSScreen />
        </View>
        <View key="inventory" className="flex-1">
          <Inventory />
        </View>
        <View key="history" className="flex-1">
          <History />
        </View>
      </PagerView>

      <View
        className="bg-kumo-base border-t border-kumo-line items-center"
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <View className="w-full" style={{ maxWidth: 500 }}>
        <View className="flex-row relative pt-2 pb-1">
          <Animated.View
            className="absolute top-0 h-1 bg-kumo-brand rounded-full"
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
                      ? "text-kumo-brand font-sans-semibold"
                      : "text-kumo-subtle font-sans-medium"
                  }`}

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
    </EmployeeTabContext.Provider>
  );
}
