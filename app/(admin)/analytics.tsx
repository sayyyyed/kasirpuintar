import React from "react";
import {
  View,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DollarSign, Users, AlertTriangle } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function AnalyticsScreen() {
  const todayRevenue = 0;
  const activeShifts = 0;
  const lowStockCount = 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="px-6 pt-6 pb-2">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
            Dashboard Pemilik
          </Text>
          <Text
            className="text-3xl font-sans-extrabold text-foreground mt-1"
            style={{ letterSpacing: -0.6 }}
          >
            Analitik
          </Text>
        </View>

        <View className="px-6 mt-4 gap-3">
          <View className="bg-primary rounded-lg p-6">
            <View className="absolute top-3 right-3 w-24 h-24 rounded-full bg-white opacity-5" />
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-sans-semibold text-white opacity-80 uppercase tracking-wider">
                  Pendapatan Hari Ini
                </Text>
                <Text
                  className="text-3xl font-sans-extrabold text-white mt-2"
                  style={{ letterSpacing: -0.8 }}
                >
                  {fmt(todayRevenue)}
                </Text>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center">
                <DollarSign size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-secondary-50 rounded-lg p-5">
              <View className="w-12 h-12 rounded-full bg-secondary-100 items-center justify-center mb-3">
                <Users size={22} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
              </View>
              <Text
                className="text-3xl font-sans-extrabold text-foreground"
                style={{ letterSpacing: -0.5 }}
              >
                {activeShifts}
              </Text>
              <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">
                Shift Aktif
              </Text>
            </View>

            <View className="flex-1 bg-accent-50 rounded-lg p-5">
              <View className="w-12 h-12 rounded-full bg-accent-100 items-center justify-center mb-3">
                <AlertTriangle size={22} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
              </View>
              <Text
                className="text-3xl font-sans-extrabold text-red-500"
                style={{ letterSpacing: -0.5 }}
              >
                {lowStockCount}
              </Text>
              <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">
                Stok Rendah
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 mt-8">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-4">
            Penjualan Mingguan
          </Text>
          <View className="bg-muted rounded-lg p-8 items-center">
            <Text className="text-base font-sans-medium text-gray-400">
              Data penjualan akan muncul di sini
            </Text>
          </View>
        </View>

        <View className="px-6 mt-8">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Produk Terlaris
          </Text>
          <View className="bg-muted rounded-lg p-8 items-center">
            <Text className="text-base font-sans-medium text-gray-400">
              Data produk terlaris akan muncul di sini
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
