import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Q } from "@nozbe/watermelondb";
import {
  DollarSign,
  Users,
  AlertTriangle,
  Package,
  Calendar,
  ChevronRight,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { database } from "@/db";
import ReportsSheet from "@/components/admin/ReportsSheet";

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
};

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function startOfDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const WEEK_COLORS = [
  Colors.primary.DEFAULT,
  Colors.secondary.DEFAULT,
  Colors.accent.DEFAULT,
  "#6366F1",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

export default function AnalyticsScreen() {
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayTxns, setTodayTxns] = useState(0);
  const [activeShifts, setActiveShifts] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [weekly, setWeekly] = useState<{ day: string; total: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; total: number; qty: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const weeklyMax = Math.max(...weekly.map((w) => w.total), 1);

  const loadData = useCallback(async () => {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    const [txns, shifts, products, items] = await Promise.all([
      database.get("transactions").query(
        Q.where("created_at", Q.gte(todayStart)),
        Q.where("created_at", Q.lte(todayEnd)),
      ).fetch(),
      database.get("shifts").query(
        Q.where("status", Q.eq("open")),
      ).fetch(),
      database.get("products").query(
        Q.where("deleted_at", Q.eq(null)),
        Q.where("active", Q.eq(true)),
      ).fetch(),
      database.get("transaction_items").query(
        Q.where("created_at", Q.gte(todayStart)),
        Q.where("created_at", Q.lte(todayEnd)),
      ).fetch(),
    ]).catch(() => [[], [], [], []]);

    const revenue = (txns as any[]).reduce((s: number, t: any) => s + (t.total || 0), 0);
    setTodayRevenue(revenue);
    setTodayTxns((txns as any[]).length);
    setActiveShifts((shifts as any[]).length);
    setLowStock((products as any[]).filter((p: any) => (p.stock || 0) <= 10).length);

    const weekData: { day: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const s = startOfDay(i);
      const e = endOfDay(i);
      const dayTxns = await database.get("transactions").query(
        Q.where("created_at", Q.gte(s)),
        Q.where("created_at", Q.lte(e)),
      ).fetch().catch(() => []);
      const dayTotal = (dayTxns as any[]).reduce((sum: number, t: any) => sum + (t.total || 0), 0);
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekData.push({ day: DAY_NAMES[d.getDay()], total: dayTotal });
    }
    setWeekly(weekData);

    const topMap: Record<string, { name: string; total: number; qty: number }> = {};
    for (const item of items as any[]) {
      const key = item.productName || item.product_name || "?";
      if (!topMap[key]) topMap[key] = { name: key, total: 0, qty: 0 };
      topMap[key].total += (item.subtotal || item.price * item.qty || 0);
      topMap[key].qty += (item.qty || 0);
    }
    setTopProducts(
      Object.values(topMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    );
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.DEFAULT]} />}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2 flex-row items-end justify-between">
          <View>
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
          <Pressable
            className="bg-muted rounded-md px-4 py-2.5 flex-row items-center active:bg-gray-200"
            onPress={() => setShowReports(true)}
          >
            <Calendar size={16} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
            <Text className="ml-2 text-xs font-sans-bold text-primary uppercase tracking-wider">
              Riwayat
            </Text>
            <ChevronRight size={14} color={Colors.primary.DEFAULT} />
          </Pressable>
        </View>

        {/* Revenue Card */}
        <View className="px-6 mt-4">
          <View className="bg-primary rounded-lg p-6">
            <View className="absolute top-3 right-3 w-24 h-24 rounded-full bg-white opacity-5" />
            <View className="absolute bottom-2 right-16 w-16 h-16 rounded-lg bg-white opacity-5 rotate-45" />
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
                {todayTxns > 0 && (
                  <Text className="text-xs font-sans-medium text-white opacity-60 mt-1">
                    {todayTxns} transaksi
                  </Text>
                )}
              </View>
              <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center">
                <DollarSign size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          </View>
        </View>

        {/* KPI Row */}
        <View className="px-6 mt-3 flex-row gap-3">
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
              className={`text-3xl font-sans-extrabold ${lowStock > 0 ? "text-red-500" : "text-foreground"}`}
              style={{ letterSpacing: -0.5 }}
            >
              {lowStock}
            </Text>
            <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">
              Stok Rendah
            </Text>
          </View>
        </View>

        {/* Weekly Sales Chart */}
        <View className="px-6 mt-8">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-4">
            Penjualan 7 Hari
          </Text>
          <View className="bg-muted rounded-lg p-5">
            <View className="flex-row items-end justify-between" style={{ height: 120 }}>
              {weekly.map((d, i) => (
                <View key={i} className="items-center flex-1">
                  <Text className="text-[10px] font-sans-bold text-gray-600 mb-1">
                    {d.total > 0 ? fmtShort(d.total) : ""}
                  </Text>
                  <View
                    className="w-8 rounded-t-md"
                    style={{
                      height: d.total > 0 ? Math.max(8, (d.total / weeklyMax) * 80) : 4,
                      backgroundColor: d.total > 0 ? WEEK_COLORS[i] : Colors.gray[200],
                    }}
                  />
                  <Text className="text-[10px] font-sans-semibold text-gray-400 mt-2">
                    {d.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Top Products */}
        <View className="px-6 mt-8">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Produk Terlaris Hari Ini
          </Text>
          {topProducts.length === 0 ? (
            <View className="bg-muted rounded-lg p-6 items-center">
              <Package size={28} color={Colors.gray[300]} strokeWidth={1.5} />
              <Text className="text-sm font-sans-medium text-gray-400 mt-2">
                Belum ada penjualan hari ini
              </Text>
            </View>
          ) : (
            <View className="bg-muted rounded-lg">
              {topProducts.map((p, i) => (
                <View
                  key={i}
                  className={`flex-row items-center py-3 px-4 ${
                    i < topProducts.length - 1 ? "border-b-2 border-white" : ""
                  }`}
                >
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: WEEK_COLORS[i] + "1A" }}
                  >
                    <Text
                      className="text-xs font-sans-extrabold"
                      style={{ color: WEEK_COLORS[i] }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-sans-bold text-foreground" numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text className="text-xs font-sans text-gray-400">
                      {p.qty}x terjual
                    </Text>
                  </View>
                  <Text className="text-sm font-sans-bold text-primary">
                    {fmt(p.total)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ReportsSheet visible={showReports} onClose={() => setShowReports(false)} />
    </SafeAreaView>
  );
}
