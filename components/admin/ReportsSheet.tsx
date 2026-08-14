import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Q } from "@nozbe/watermelondb";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Calendar,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { database } from "@/db";
import SheetModal from "@/components/ui/SheetModal";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

type RangePreset = "today" | "week" | "month" | "lastMonth";

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
  { key: "lastMonth", label: "Bulan Lalu" },
];

function getRange(preset: RangePreset): { start: number; end: number; label: string } {
  const now = new Date();
  const end = now.getTime();

  switch (preset) {
    case "today":
      now.setHours(0, 0, 0, 0);
      return { start: now.getTime(), end, label: "Hari Ini" };
    case "week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(now.getFullYear(), now.getMonth(), diff);
      mon.setHours(0, 0, 0, 0);
      return { start: mon.getTime(), end, label: "Minggu Ini" };
    }
    case "month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      first.setHours(0, 0, 0, 0);
      return { start: first.getTime(), end, label: "Bulan Ini" };
    }
    case "lastMonth": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      first.setHours(0, 0, 0, 0);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      last.setHours(23, 59, 59, 999);
      const label = first.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      return { start: first.getTime(), end: last.getTime(), label };
    }
  }
}

function formatPayment(method: string) {
  const map: Record<string, string> = {
    cash: "Tunai",
    qris: "QRIS",
    transfer: "Transfer",
  };
  return map[method] || method;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ReportsSheet({ visible, onClose }: Props) {
  const [preset, setPreset] = useState<RangePreset>("today");
  const [loading, setLoading] = useState(false);
  const [txns, setTxns] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const range = getRange(preset);
    try {
      const [txnData, expenseData] = await Promise.all([
        database.get("transactions").query(
          Q.where("created_at", Q.gte(range.start)),
          Q.where("created_at", Q.lte(range.end)),
        ).fetch().catch(() => []),
        database.get("expenses").query(
          Q.where("created_at", Q.gte(range.start)),
          Q.where("created_at", Q.lte(range.end)),
          Q.where("deleted_at", Q.eq(null)),
        ).fetch().catch(() => []),
      ]);
      const sortedTxns = (txnData as any[]).sort(
        (a: any, b: any) => (b.createdAt || b.created_at || 0) - (a.createdAt || a.created_at || 0)
      );
      setTxns(sortedTxns);
      setEntries(expenseData as any[]);

      let items = 0;
      for (const t of txnData as any[]) {
        const tItems = await database.get("transaction_items").query(
          Q.where("transaction_id", Q.eq(t.id)),
        ).fetch().catch(() => []);
        items += (tItems as any[]).length;
      }
      setTotalItems(items);
    } finally {
      setLoading(false);
    }
  }, [preset]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const revenue = txns.reduce((s: number, t: any) => s + (t.total || 0), 0);
  const income = entries
    .filter((e: any) => e.type === "income")
    .reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const expense = entries
    .filter((e: any) => e.type !== "income")
    .reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const txnCount = txns.length;
  const range = getRange(preset);

  return (
    <SheetModal visible={visible} title="Riwayat Lengkap" onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Preset selector */}
        <View className="flex-row gap-2 mb-4">
          {PRESETS.map((p) => (
            <Pressable
              key={p.key}
              className={`flex-1 py-2 rounded-md ${
                preset === p.key ? "bg-primary" : "bg-muted"
              }`}
              onPress={() => setPreset(p.key)}
            >
              <Text
                className={`text-xs font-sans-bold text-center ${
                  preset === p.key ? "text-white" : "text-gray-600"
                }`}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center mb-4 bg-muted rounded-md px-4 py-3">
          <Calendar size={16} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
          <Text className="ml-2 text-sm font-sans-bold text-foreground">
            {range.label}
          </Text>
        </View>

        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
          </View>
        ) : (
          <>
            {/* Summary */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-primary rounded-lg p-4">
                <DollarSign size={18} color="#FFF" strokeWidth={2.5} />
                <Text className="text-lg font-sans-bold text-white mt-2">
                  {fmt(revenue)}
                </Text>
                <Text className="text-[10px] font-sans-medium text-white opacity-70 uppercase tracking-wider">
                  Pendapatan
                </Text>
              </View>
              <View className="flex-1 bg-accent-50 rounded-lg p-4">
                <TrendingDown size={18} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
                <Text className="text-lg font-sans-bold text-foreground mt-2">
                  {fmt(expense)}
                </Text>
                <Text className="text-[10px] font-sans-medium text-gray-500 uppercase tracking-wider">
                  Pengeluaran
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-secondary-50 rounded-lg p-4">
                <Text className="text-lg font-sans-bold text-secondary">
                  {fmt(income)}
                </Text>
                <Text className="text-[10px] font-sans-medium text-gray-500 uppercase tracking-wider">
                  Pemasukan Manual
                </Text>
              </View>
              <View className="flex-1 bg-muted rounded-lg p-4">
                <Text className="text-lg font-sans-bold text-foreground">
                  {txnCount}
                </Text>
                <Text className="text-[10px] font-sans-medium text-gray-500 uppercase tracking-wider">
                  Transaksi ({totalItems} item)
                </Text>
              </View>
            </View>

            {/* Laba/Rugi */}
            <View className="bg-primary rounded-lg p-4 mb-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-sans-bold text-white opacity-80 uppercase tracking-wider">
                  Laba Bersih
                </Text>
                <Text className="text-xl font-sans-extrabold text-white">
                  {fmt(revenue + income - expense)}
                </Text>
              </View>
            </View>

            {/* Transactions List */}
            {txns.length > 0 ? (
              <View className="mb-4">
                <Text className="text-sm font-sans-bold text-gray-500 uppercase tracking-wider mb-2">
                  Transaksi ({txns.length})
                </Text>
                {txns.map((t: any) => (
                  <View
                    key={t.id}
                    className="flex-row items-center justify-between py-3 border-b-2 border-muted"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 rounded-full bg-muted items-center justify-center mr-3">
                        <ShoppingCart size={14} color={Colors.primary.DEFAULT} strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-sans-bold text-foreground">
                          {formatPayment(t.paymentMethod)}
                        </Text>
                        <Text className="text-[10px] font-sans text-gray-400">
                          {t.createdAt
                            ? t.createdAt.toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-sans-bold text-foreground">
                      {fmt(t.total || 0)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center py-6">
                <Text className="text-sm font-sans text-gray-400">
                  Tidak ada transaksi
                </Text>
              </View>
            )}

            {/* Expense entries */}
            {entries.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-sans-bold text-gray-500 uppercase tracking-wider mb-2">
                  Catatan Kas ({entries.length})
                </Text>
                {entries.map((e: any) => (
                  <View
                    key={e.id}
                    className="flex-row items-center justify-between py-3 border-b-2 border-muted"
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                          e.type === "income" ? "bg-secondary-100" : "bg-accent-100"
                        }`}
                      >
                        {e.type === "income" ? (
                          <TrendingUp size={14} color={Colors.secondary.DEFAULT} strokeWidth={2} />
                        ) : (
                          <TrendingDown size={14} color={Colors.accent.DEFAULT} strokeWidth={2} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-sans-bold text-foreground">
                          {e.name}
                        </Text>
                        <Text className="text-[10px] font-sans text-gray-400">
                          {e.category}
                          {e.createdAt
                            ? " · " + e.createdAt.toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })
                            : ""}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className={`text-sm font-sans-bold ${
                        e.type === "income" ? "text-secondary" : "text-accent"
                      }`}
                    >
                      {e.type === "income" ? "+" : "-"}{fmt(e.amount || 0)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SheetModal>
  );
}
