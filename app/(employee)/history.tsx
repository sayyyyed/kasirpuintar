import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, TrendingUp, TrendingDown, DollarSign } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { getShiftsByUser } from "@/services/repositories/shiftRepository";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function HistoryScreen() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getShiftsByUser(user.id).then((data) => {
        setShifts(data || []);
        setLoading(false);
      });
    }
  }, [user?.id]);

  const totalRevenue = shifts.reduce((s: number, i: any) => s + (i.sales_total || 0), 0);
  const totalExpenses = shifts.reduce((s: number, i: any) => s + (i.expense_total || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </SafeAreaView>
    );
  }

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
          {shifts.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-base font-sans-medium text-gray-400">Belum ada riwayat shift</Text>
            </View>
          ) : (
            shifts.map((shift: any) => (
            <View key={shift.id} className="bg-muted rounded-lg p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-sans-bold text-foreground">
                  {new Date(shift.clock_in_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <View className="flex-row items-center bg-white rounded-md px-3 py-1">
                  <Clock size={14} color={Colors.gray[500]} strokeWidth={2} />
                  <Text className="text-xs font-sans-semibold text-gray-600 ml-1">
                    {shift.status === "closed" ? "Selesai" : "Berjalan"}
                  </Text>
                </View>
              </View>
              <Text className="text-xs font-sans text-gray-500 mb-3">
                {new Date(shift.clock_in_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                —{" "}
                {shift.clock_out_at
                  ? new Date(shift.clock_out_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "sekarang"}
              </Text>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-xs font-sans-medium text-gray-400 uppercase">Pendapatan</Text>
                  <Text className="text-sm font-sans-bold text-secondary">{fmt(shift.sales_total || 0)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-sans-medium text-gray-400 uppercase">Pengeluaran</Text>
                  <Text className="text-sm font-sans-bold text-accent">{fmt(shift.expense_total || 0)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-sans-medium text-gray-400 uppercase">Laba</Text>
                  <Text className="text-sm font-sans-bold text-primary">
                    {fmt((shift.sales_total || 0) - (shift.expense_total || 0))}
                  </Text>
                </View>
              </View>
            </View>
          )))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
