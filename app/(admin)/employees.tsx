import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { UserPlus, Clock, MoreVertical, Shield, ShoppingCart } from "lucide-react-native";
import { Badge } from "@/components/ui/Badge";
import { Colors } from "@/constants/Colors";

const EMPLOYEES = [
  { id: "1", name: "Ahmad Kasir", role: "kasir", status: "active", shiftStart: "08:00", revenue: 2450000 },
  { id: "2", name: "Budi Setiawan", role: "kasir", status: "active", shiftStart: "08:30", revenue: 1980000 },
  { id: "3", name: "Citra Dewi", role: "kasir", status: "active", shiftStart: "09:00", revenue: 3100000 },
  { id: "4", name: "Dian Pratama", role: "kasir", status: "offline", shiftStart: null, revenue: 0 },
  { id: "5", name: "Eka Lestari", role: "admin", status: "offline", shiftStart: null, revenue: 0 },
];

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function EmployeesScreen() {
  const activeCount = EMPLOYEES.filter((e) => e.status === "active").length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-end justify-between">
        <View>
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
            Manajemen
          </Text>
          <Text className="text-2xl font-sans-extrabold text-foreground mt-1" style={{ letterSpacing: -0.5 }}>
            Karyawan
          </Text>
        </View>
        <Pressable className="bg-primary rounded-md px-4 py-3 flex-row items-center">
          <UserPlus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-sm font-sans-bold text-white ml-2">Tambah</Text>
        </Pressable>
      </View>

      {/* Summary */}
      <View className="px-6 py-4 flex-row gap-3">
        <View className="flex-1 bg-secondary-50 rounded-lg p-4">
          <Text className="text-2xl font-sans-extrabold text-secondary">{activeCount}</Text>
          <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">Aktif</Text>
        </View>
        <View className="flex-1 bg-muted rounded-lg p-4">
          <Text className="text-2xl font-sans-extrabold text-foreground">{EMPLOYEES.length}</Text>
          <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">Total Staf</Text>
        </View>
      </View>

      {/* Employee List */}
      <FlashList
        data={EMPLOYEES}
        estimatedItemSize={96}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center py-4 border-b-2 border-muted">
            {/* Avatar */}
            <View className={`w-12 h-12 rounded-full items-center justify-center ${item.status === "active" ? "bg-secondary-100" : "bg-gray-200"}`}>
              <Text className="text-lg font-sans-bold text-foreground">
                {item.name.charAt(0)}
              </Text>
            </View>

            {/* Info */}
            <View className="ml-4 flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-sans-bold text-foreground">{item.name}</Text>
                {item.role === "admin" && (
                  <View className="bg-primary-100 px-2 py-0.5 rounded">
                    <Text className="text-xs font-sans-bold text-primary">Admin</Text>
                  </View>
                )}
              </View>
              {item.status === "active" ? (
                <View className="flex-row items-center mt-1">
                  <Clock size={12} color={Colors.gray[400]} strokeWidth={2} />
                  <Text className="text-xs font-sans text-gray-500 ml-1">
                    Mulai {item.shiftStart} · {fmt(item.revenue)}
                  </Text>
                </View>
              ) : (
                <Text className="text-xs font-sans text-gray-400 mt-1">Offline</Text>
              )}
            </View>

            {/* Status + Action */}
            <View className="flex-row items-center gap-2">
              <Badge variant={item.status === "active" ? "secondary" : "muted"}>
                {item.status === "active" ? "Aktif" : "Off"}
              </Badge>
              <Pressable className="w-8 h-8 items-center justify-center">
                <MoreVertical size={18} color={Colors.gray[400]} />
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
