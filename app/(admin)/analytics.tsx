import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";

const WEEKLY_DATA = [
  { day: "Sen", value: 2400000 },
  { day: "Sel", value: 1800000 },
  { day: "Rab", value: 3200000 },
  { day: "Kam", value: 2900000 },
  { day: "Jum", value: 3800000 },
  { day: "Sab", value: 4200000 },
  { day: "Min", value: 3500000 },
];

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const maxVal = Math.max(...WEEKLY_DATA.map((d) => d.value));

export default function AnalyticsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
            Dashboard Pemilik
          </Text>
          <Text className="text-3xl font-sans-extrabold text-foreground mt-1" style={{ letterSpacing: -0.6 }}>
            Analitik
          </Text>
        </View>

        {/* Stat Cards */}
        <View className="px-6 mt-4 gap-3">
          {/* Today's Revenue */}
          <View className="bg-primary rounded-lg p-6">
            <View className="absolute top-3 right-3 w-24 h-24 rounded-full bg-white opacity-5" />
            <View className="absolute bottom-4 right-20 w-16 h-16 rounded-lg bg-white opacity-5 rotate-45" />
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-sans-semibold text-white opacity-80 uppercase tracking-wider">
                  Pendapatan Hari Ini
                </Text>
                <Text className="text-3xl font-sans-extrabold text-white mt-2" style={{ letterSpacing: -0.8 }}>
                  Rp 4.250.000
                </Text>
                <View className="flex-row items-center mt-2">
                  <ArrowUpRight size={16} color="#10B981" strokeWidth={2.5} />
                  <Text className="text-sm font-sans-semibold text-green-300 ml-1">
                    +12.5% dari kemarin
                  </Text>
                </View>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center">
                <DollarSign size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          </View>

          {/* Active Shifts & Low Stock row */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-secondary-50 rounded-lg p-5">
              <View className="w-12 h-12 rounded-full bg-secondary-100 items-center justify-center mb-3">
                <Users size={22} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
              </View>
              <Text className="text-3xl font-sans-extrabold text-foreground" style={{ letterSpacing: -0.5 }}>
                3
              </Text>
              <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">
                Shift Aktif
              </Text>
            </View>

            <View className="flex-1 bg-accent-50 rounded-lg p-5">
              <View className="w-12 h-12 rounded-full bg-accent-100 items-center justify-center mb-3">
                <AlertTriangle size={22} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
              </View>
              <Text className="text-3xl font-sans-extrabold text-red-500" style={{ letterSpacing: -0.5 }}>
                4
              </Text>
              <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">
                Stok Rendah
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Sales Chart */}
        <View className="px-6 mt-8">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-4">
            Penjualan Mingguan
          </Text>
          <View className="bg-muted rounded-lg p-5">
            <View className="flex-row items-end justify-between h-40 gap-2">
              {WEEKLY_DATA.map((item) => {
                const heightPct = (item.value / maxVal) * 100;
                const isMax = item.value === maxVal;
                return (
                  <View key={item.day} className="flex-1 items-center">
                    <Text className="text-xs font-sans-bold text-gray-500 mb-1">
                      {(item.value / 1000000).toFixed(1)}
                    </Text>
                    <View
                      className={`w-full rounded-t-md ${isMax ? "bg-primary" : "bg-primary-200"}`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <Text className="text-xs font-sans-semibold text-gray-500 mt-2">
                      {item.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Top Products */}
        <View className="px-6 mt-8">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Produk Terlaris
          </Text>
          {[
            { name: "Ayam Geprek", sold: 145, trend: "up" },
            { name: "Nasi Goreng", sold: 132, trend: "up" },
            { name: "Kopi Susu", sold: 98, trend: "down" },
            { name: "Es Teh Manis", sold: 87, trend: "up" },
          ].map((item, i) => (
            <View key={i} className="flex-row items-center py-3 border-b-2 border-muted">
              <View className="w-8 h-8 rounded-md bg-primary-100 items-center justify-center">
                <Text className="text-sm font-sans-bold text-primary">{i + 1}</Text>
              </View>
              <Text className="flex-1 ml-3 text-base font-sans-bold text-foreground">{item.name}</Text>
              <View className="flex-row items-center">
                <Text className="text-sm font-sans-semibold text-gray-600 mr-1">{item.sold}</Text>
                {item.trend === "up" ? (
                  <ArrowUpRight size={16} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
                ) : (
                  <ArrowDownRight size={16} color="#EF4444" strokeWidth={2.5} />
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
