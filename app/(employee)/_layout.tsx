import React from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Clock,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";

export default function EmployeeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 2,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: Colors.primary.DEFAULT,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarLabelStyle: {
          fontFamily: "Outfit_600SemiBold",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: "Kasir",
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Stok",
          tabBarIcon: ({ color, size }) => (
            <Package size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Riwayat",
          tabBarIcon: ({ color, size }) => (
            <Clock size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
