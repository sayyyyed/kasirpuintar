import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Timer,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import { Badge } from "@/components/ui/Badge";
import { Colors } from "@/constants/Colors";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [shiftSeconds, setShiftSeconds] = useState(0);

  // Shift timer
  useEffect(() => {
    const interval = setInterval(() => {
      setShiftSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = useMemo(() => {
    const hrs = Math.floor(shiftSeconds / 3600);
    const mins = Math.floor((shiftSeconds % 3600) / 60);
    const secs = shiftSeconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [shiftSeconds]);

  // Mock data
  const todayStats = {
    revenue: "Rp 2.450.000",
    transactions: 34,
    items: 87,
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
            Selamat Datang
          </Text>
          <Text
            className="text-3xl font-sans-extrabold text-foreground mt-1"
            style={{ letterSpacing: -0.6 }}
          >
            Ahmad Kasir
          </Text>
          <Badge variant="secondary">Shift Aktif</Badge>
        </View>

        {/* Shift Timer Card */}
        <View className="px-6 mb-6">
          <View className="bg-primary rounded-lg p-6">
            {/* Decorative shapes */}
            <View className="absolute top-3 right-3 w-20 h-20 rounded-full bg-white opacity-5" />
            <View className="absolute bottom-4 right-16 w-12 h-12 rounded-lg bg-white opacity-5 rotate-45" />

            <View className="flex-row items-center mb-3">
              <Timer size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="ml-2 text-sm font-sans-semibold text-white uppercase tracking-wider opacity-80">
                Durasi Shift
              </Text>
            </View>
            <Text
              className="text-5xl font-sans-extrabold text-white"
              style={{ letterSpacing: -1.5 }}
            >
              {formattedTime}
            </Text>
            <Text className="text-sm font-sans text-white opacity-60 mt-2">
              Mulai pukul 08:00 WIB
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Hari Ini
          </Text>
          <View className="flex-row gap-3">
            {/* Revenue */}
            <Card color="blue" className="flex-1">
              <IconCircle color="primary" size="sm">
                <DollarSign size={18} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
              </IconCircle>
              <Text className="text-2xl font-sans-bold text-foreground mt-3" style={{ letterSpacing: -0.5 }}>
                {todayStats.revenue}
              </Text>
              <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider mt-1">
                Pendapatan
              </Text>
            </Card>

            {/* Transactions */}
            <View className="gap-3 flex-1">
              <Card color="green" className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-2xl font-sans-bold text-foreground" style={{ letterSpacing: -0.5 }}>
                    {todayStats.transactions}
                  </Text>
                  <IconCircle color="secondary" size="sm">
                    <ShoppingCart size={16} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
                  </IconCircle>
                </View>
                <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider mt-1">
                  Transaksi
                </Text>
              </Card>
              <Card color="amber" className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-2xl font-sans-bold text-foreground" style={{ letterSpacing: -0.5 }}>
                    {todayStats.items}
                  </Text>
                  <IconCircle color="accent" size="sm">
                    <TrendingUp size={16} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
                  </IconCircle>
                </View>
                <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider mt-1">
                  Item Terjual
                </Text>
              </Card>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Aksi Cepat
          </Text>
          <Pressable
            className="flex-row items-center bg-muted rounded-lg p-4"
            onPress={() => router.push("/(employee)/pos")}
          >
            <IconCircle color="primary" size="sm">
              <ShoppingCart size={18} color={Colors.primary.DEFAULT} strokeWidth={2} />
            </IconCircle>
            <View className="ml-4 flex-1">
              <Text className="text-base font-sans-bold text-foreground">
                Buka Kasir
              </Text>
              <Text className="text-xs font-sans text-gray-500">
                Mulai transaksi baru
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.gray[400]} />
          </Pressable>
        </View>

        {/* Clock Out */}
        <View className="px-6">
          <Pressable className="h-14 rounded-md items-center justify-center border-4 border-red-500 flex-row">
            <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
            <Text className="ml-2 text-base font-sans-bold text-red-500">
              Akhiri Shift
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
