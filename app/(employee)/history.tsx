import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, TrendingUp, TrendingDown, DollarSign } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

const SHIFTS = [
  { id: "1", date: "12 Mei 2026", start: "08:00", end: "16:00", duration: "8j 0m", revenue: 2450000, expenses: 150000 },
  { id: "2", date: "11 Mei 2026", start: "08:00", end: "15:30", duration: "7j 30m", revenue: 1980000, expenses: 120000 },
  { id: "3", date: "10 Mei 2026", start: "09:00", end: "17:00", duration: "8j 0m", revenue: 3100000, expenses: 200000 },
  { id: "4", date: "9 Mei 2026", start: "08:00", end: "16:30", duration: "8j 30m", revenue: 2750000, expenses: 180000 },
  { id: "5", date: "8 Mei 2026", start: "08:00", end: "15:00", duration: "7j 0m", revenue: 1650000, expenses: 100000 },
];

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function HistoryScreen() {
  const totalRevenue = SHIFTS.reduce((s, i) => s + i.revenue, 0);
  const totalExpenses = SHIFTS.reduce((s, i) => s + i.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-sans-extrabold text-foreground" style={{ letterSpacing: -0.5 }}>
            Riwayat Shift
          </Text>
          <Text className="text-sm font-sans text-gray-500 mt-1">Laporan performa pribadi</Text>
        </View>

        {/* Summary Cards */}
        <View className="px-6 mb-6 flex-row gap-3">
          <View className="flex-1 bg-secondary-50 rounded-lg p-4">
            <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center mb-2">
              <TrendingUp size={18} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
            </View>
            <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider">Pendapatan</Text>
            <Text className="text-lg font-sans-bold text-foreground mt-1">{fmt(totalRevenue)}</Text>
          </View>
          <View className="flex-1 bg-accent-50 rounded-lg p-4">
            <View className="w-10 h-10 rounded-full bg-accent-100 items-center justify-center mb-2">
              <TrendingDown size={18} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
            </View>
            <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider">Pengeluaran</Text>
            <Text className="text-lg font-sans-bold text-foreground mt-1">{fmt(totalExpenses)}</Text>
          </View>
          <View className="flex-1 bg-primary-50 rounded-lg p-4">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mb-2">
              <DollarSign size={18} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
            </View>
            <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider">Laba</Text>
            <Text className="text-lg font-sans-bold text-foreground mt-1">{fmt(totalProfit)}</Text>
          </View>
        </View>

        {/* Shift List */}
        <View className="px-6">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">Daftar Shift</Text>
          {SHIFTS.map((shift) => (
            <View key={shift.id} className="bg-muted rounded-lg p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-sans-bold text-foreground">{shift.date}</Text>
                <View className="flex-row items-center bg-white rounded-md px-3 py-1">
                  <Clock size={14} color={Colors.gray[500]} strokeWidth={2} />
                  <Text className="text-xs font-sans-semibold text-gray-600 ml-1">{shift.duration}</Text>
                </View>
              </View>
              <Text className="text-xs font-sans text-gray-500 mb-3">
                {shift.start} — {shift.end}
              </Text>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-xs font-sans-medium text-gray-400 uppercase">Pendapatan</Text>
                  <Text className="text-sm font-sans-bold text-secondary">{fmt(shift.revenue)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-sans-medium text-gray-400 uppercase">Pengeluaran</Text>
                  <Text className="text-sm font-sans-bold text-accent">{fmt(shift.expenses)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-sans-medium text-gray-400 uppercase">Laba</Text>
                  <Text className="text-sm font-sans-bold text-primary">{fmt(shift.revenue - shift.expenses)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
