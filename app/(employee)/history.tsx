import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { usePayrollSettings } from "@/hooks/usePayrollSettings";
import { Q } from "@nozbe/watermelondb";
import {
  getTransactionsByShift,
  getTransactionItems,
} from "@/services/repositories/transactionRepository";
import { getExpensesByShift } from "@/services/repositories/expenseRepository";
import SheetModal from "@/components/ui/SheetModal";
import { database } from "@/db";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

type ShiftRecord = any;

function formatDate(date: Date | undefined | null) {
  if (!date) return "";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date: Date | undefined | null) {
  if (!date) return "--:--";
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPaymentMethod(method: string) {
  const map: Record<string, string> = {
    cash: "Tunai",
    qris: "QRIS",
    transfer: "Transfer",
  };
  return map[method] || method;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const { enabled: payrollEnabled } = usePayrollSettings();
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<ShiftRecord | null>(null);
  const [detailTxns, setDetailTxns] = useState<any[]>([]);
  const [detailItems, setDetailItems] = useState<Record<string, any[]>>({});
  const [detailEntries, setDetailEntries] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    // Reaktif: daftar shift ikut ter-update otomatis saat clock-in/clock-out
    // tanpa perlu logout/login.
    const sub = database
      .get("shifts")
      .query(Q.where("user_id", Q.eq(user.id)))
      .observe()
      .subscribe((records) => {
        const sorted = [...(records as any[])].sort(
          (a, b) =>
            (b.clockInAt?.getTime?.() ?? 0) -
            (a.clockInAt?.getTime?.() ?? 0)
        );
        setShifts(sorted);
        setLoading(false);
      });

    database
      .get("users")
      .find(user.id)
      .then((u: any) => {
        setHourlyRate(u.hourlyRate ?? 0);
      })
      .catch(() => {});

    return () => sub.unsubscribe();
  }, [user?.id]);

  const totalRevenue = shifts.reduce((s: number, i: any) => s + (i.salesTotal || 0), 0);
  const totalExpenses = shifts.reduce((s: number, i: any) => s + (i.expenseTotal || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;

  const openDetail = async (shift: ShiftRecord) => {
    setSelectedShift(shift);
    setDetailTxns([]);
    setDetailItems({});
    setDetailEntries([]);
    setDetailLoading(true);
    try {
      const shiftId = shift.id;
      const [txns, entries] = await Promise.all([
        getTransactionsByShift(shiftId).catch(() => []),
        getExpensesByShift(shiftId).catch(() => []),
      ]);
      setDetailTxns(txns as any[]);
      setDetailEntries(entries as any[]);

      const itemLists = await Promise.all(
        (txns as any[]).map((t) =>
          getTransactionItems(t.id).catch(() => []),
        ),
      );
      const itemsByTxn: Record<string, any[]> = {};
      (txns as any[]).forEach((t, i) => {
        itemsByTxn[t.id] = (itemLists[i] as any[]) || [];
      });
      setDetailItems(itemsByTxn);
    } finally {
      setDetailLoading(false);
    }
  };

  const detailIncome = detailEntries
    .filter((e: any) => e.type === "income")
    .reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const detailExpense = detailEntries
    .filter((e: any) => e.type !== "income")
    .reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const detailSales = detailTxns.reduce((s: number, t: any) => s + (t.total || 0), 0);
  const detailTotalIncome = detailSales + detailIncome;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-kumo-base items-center justify-center">
        <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-kumo-base">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-sans-semibold text-kumo-default" >
            Riwayat Shift
          </Text>
          <Text className="text-sm font-sans text-kumo-subtle mt-1">Laporan performa pribadi</Text>
        </View>

        <View className="px-6 mb-6 flex-row gap-3">
          <View className="flex-1 bg-kumo-success-tint rounded-lg p-4">
            <View className="w-10 h-10 rounded-full bg-kumo-success-tint items-center justify-center mb-2">
              <TrendingUp size={18} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
            </View>
            <Text className="text-xs font-sans-medium text-kumo-subtle  ">Pendapatan</Text>
            <Text className="text-lg font-sans-semibold text-kumo-default mt-1">{fmt(totalRevenue)}</Text>
          </View>
          <View className="flex-1 bg-kumo-warning-tint rounded-lg p-4">
            <View className="w-10 h-10 rounded-full bg-kumo-warning-tint items-center justify-center mb-2">
              <TrendingDown size={18} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
            </View>
            <Text className="text-xs font-sans-medium text-kumo-subtle  ">Pengeluaran</Text>
            <Text className="text-lg font-sans-semibold text-kumo-default mt-1">{fmt(totalExpenses)}</Text>
          </View>
          <View className="flex-1 bg-kumo-info-tint rounded-lg p-4">
            <View className="w-10 h-10 rounded-full bg-kumo-info-tint items-center justify-center mb-2">
              <DollarSign size={18} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
            </View>
            <Text className="text-xs font-sans-medium text-kumo-subtle  ">Laba</Text>
            <Text className="text-lg font-sans-semibold text-kumo-default mt-1">{fmt(totalProfit)}</Text>
          </View>
        </View>

        <View className="px-6">
          <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-3">Daftar Shift</Text>
          {shifts.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-base font-sans-medium text-kumo-subtle">Belum ada riwayat shift</Text>
            </View>
          ) : (
            shifts.map((shift: any) => (
              <Pressable
                key={shift.id}
                className="bg-kumo-base border border-kumo-hairline rounded-lg p-4 mb-3 active:bg-kumo-fill-hover"
                onPress={() => openDetail(shift)}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-base font-sans-semibold text-kumo-default">
                      {formatDate(shift.clockInAt)}
                    </Text>
                    <ChevronRight size={16} color={Colors.gray[400]} style={{ marginLeft: 4 }} />
                  </View>
                  <View className="flex-row items-center bg-kumo-base rounded-md px-3 py-1">
                    <Clock size={14} color={Colors.gray[500]} strokeWidth={2} />
                    <Text className="text-xs font-sans-semibold text-kumo-subtle ml-1">
                      {shift.status === "closed" ? "Selesai" : "Berjalan"}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs font-sans text-kumo-subtle mb-3">
                  {formatTime(shift.clockInAt)}{" "}
                  {"—"}{" "}
                  {shift.clockOutAt
                    ? formatTime(shift.clockOutAt)
                    : "sekarang"}
                </Text>
                {payrollEnabled && hourlyRate > 0 && shift.clockInAt && shift.clockOutAt && (
                  <Text className="text-xs font-sans-semibold text-kumo-success mb-3">
                    Upah: {fmt(Math.round(((shift.clockOutAt.getTime() - shift.clockInAt.getTime()) / 3_600_000) * hourlyRate))}
                  </Text>
                )}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-xs font-sans-medium text-kumo-subtle ">Pendapatan</Text>
                    <Text className="text-sm font-sans-semibold text-kumo-success">{fmt(shift.salesTotal || 0)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-sans-medium text-kumo-subtle ">Pengeluaran</Text>
                    <Text className="text-sm font-sans-semibold text-kumo-warning">{fmt(shift.expenseTotal || 0)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-sans-medium text-kumo-subtle ">Laba</Text>
                    <Text className="text-sm font-sans-semibold text-kumo-brand">
                      {fmt((shift.salesTotal || 0) - (shift.expenseTotal || 0))}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Shift Detail Modal */}
      <SheetModal
        visible={!!selectedShift}
        title={selectedShift ? formatDate(selectedShift.clockInAt) : ""}
        onClose={() => setSelectedShift(null)}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {detailLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
            </View>
          ) : (
            <>
              {/* Shift Info */}
              <View className="bg-kumo-base border border-kumo-hairline rounded-lg p-4 mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-sans-semibold text-kumo-default">
                    {selectedShift?.status === "closed" ? "Shift Selesai" : "Shift Berjalan"}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${
                    selectedShift?.status === "closed" ? "bg-kumo-success-tint" : "bg-kumo-warning-tint"
                  }`}>
                    <Text className={`text-xs font-sans-semibold ${
                      selectedShift?.status === "closed" ? "text-kumo-success" : "text-kumo-warning"
                    }`}>
                      {selectedShift?.status === "closed" ? "Closed" : "Open"}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs font-sans text-kumo-subtle">
                  {formatTime(selectedShift?.clockInAt)} — {formatTime(selectedShift?.clockOutAt)}
                </Text>
                {selectedShift?.clockInAt && selectedShift?.clockOutAt && (
                  <Text className="text-xs font-sans text-kumo-subtle mt-1">
                    Durasi: {Math.round((selectedShift.clockOutAt.getTime() - selectedShift.clockInAt.getTime()) / 60000)} menit
                  </Text>
                )}
                {payrollEnabled && hourlyRate > 0 && selectedShift?.clockInAt && selectedShift?.clockOutAt && (
                  <Text className="text-xs font-sans-semibold text-kumo-success mt-1">
                    Upah: {fmt(Math.round(((selectedShift.clockOutAt.getTime() - selectedShift.clockInAt.getTime()) / 3_600_000) * hourlyRate))}
                  </Text>
                )}
              </View>

              {/* Summary */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-kumo-success-tint rounded-lg p-3">
                  <Text className="text-[10px] font-sans-semibold text-kumo-subtle  ">
                    Pendapatan
                  </Text>
                  <Text className="text-sm font-sans-semibold text-kumo-success mt-1">
                    {fmt(detailTotalIncome)}
                  </Text>
                </View>
                <View className="flex-1 bg-kumo-warning-tint rounded-lg p-3">
                  <Text className="text-[10px] font-sans-semibold text-kumo-subtle  ">
                    Pengeluaran
                  </Text>
                  <Text className="text-sm font-sans-semibold text-kumo-warning mt-1">
                    {fmt(detailExpense)}
                  </Text>
                </View>
                <View className="flex-1 bg-kumo-info-tint rounded-lg p-3">
                  <Text className="text-[10px] font-sans-semibold text-kumo-subtle  ">
                    Laba
                  </Text>
                  <Text className="text-sm font-sans-semibold text-kumo-brand mt-1">
                    {fmt(detailTotalIncome - detailExpense)}
                  </Text>
                </View>
              </View>

              {/* Transaction list */}
              {detailTxns.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-2">
                    Transaksi POS ({detailTxns.length})
                  </Text>
                  {detailTxns.map((t: any) => {
                    const items = detailItems[t.id] || [];
                    return (
                      <View
                        key={t.id}
                        className="py-3 border-b border-kumo-line"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className="w-8 h-8 rounded-full bg-kumo-info-tint items-center justify-center mr-3">
                              <ShoppingCart size={14} color={Colors.primary.DEFAULT} strokeWidth={2} />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs font-sans-semibold text-kumo-default">
                                {formatPaymentMethod(t.paymentMethod)}
                              </Text>
                              <Text className="text-[10px] font-sans text-kumo-subtle">
                                {formatTime(t.createdAt)} · {items.length} menu
                              </Text>
                            </View>
                          </View>
                          <Text className="text-sm font-sans-semibold text-kumo-default">
                            {fmt(t.total || 0)}
                          </Text>
                        </View>

                        {/* Detail menu yang dipesan */}
                        {items.length > 0 && (
                          <View className="mt-2 ml-11 border-l border-kumo-hairline pl-3">
                            {items.map((it: any) => (
                              <View
                                key={it.id}
                                className="flex-row items-start justify-between py-0.5"
                              >
                                <Text className="text-[11px] font-sans text-kumo-subtle flex-1 mr-3">
                                  {it.qty ?? it.quantity}×{" "}
                                  {it.productName ?? it.product_name ?? "Item"}
                                </Text>
                                <Text className="text-[11px] font-sans text-kumo-default">
                                  {fmt(
                                    it.subtotal ??
                                      (it.price || 0) * (it.qty ?? it.quantity ?? 0),
                                  )}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                  <View className="flex-row justify-between pt-3">
                    <Text className="text-xs font-sans-semibold text-kumo-subtle">
                      Subtotal Penjualan
                    </Text>
                    <Text className="text-xs font-sans-semibold text-kumo-success">
                      {fmt(detailSales)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Pemasukan manual entries */}
              {detailEntries.filter((e: any) => e.type === "income").length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-2">
                    Pemasukan Manual
                  </Text>
                  {detailEntries
                    .filter((e: any) => e.type === "income")
                    .map((e: any) => (
                      <View
                        key={e.id}
                        className="flex-row items-center justify-between py-3 border-b border-kumo-line"
                      >
                        <View className="flex-row items-center flex-1">
                          <View className="w-8 h-8 rounded-full bg-kumo-success-tint items-center justify-center mr-3">
                            <ArrowUpCircle size={14} color={Colors.secondary.DEFAULT} strokeWidth={2} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-sans-semibold text-kumo-default">
                              {e.name}
                            </Text>
                            <Text className="text-[10px] font-sans text-kumo-subtle">
                              {e.category}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-sm font-sans-semibold text-kumo-success">
                          +{fmt(e.amount || 0)}
                        </Text>
                      </View>
                    ))}
                  <View className="flex-row justify-between pt-3">
                    <Text className="text-xs font-sans-semibold text-kumo-subtle">
                      Total Pemasukan Manual
                    </Text>
                    <Text className="text-xs font-sans-semibold text-kumo-success">
                      {fmt(detailIncome)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Pengeluaran manual entries */}
              {detailEntries.filter((e: any) => e.type !== "income").length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-2">
                    Pengeluaran
                  </Text>
                  {detailEntries
                    .filter((e: any) => e.type !== "income")
                    .map((e: any) => (
                      <View
                        key={e.id}
                        className="flex-row items-center justify-between py-3 border-b border-kumo-line"
                      >
                        <View className="flex-row items-center flex-1">
                          <View className="w-8 h-8 rounded-full bg-kumo-warning-tint items-center justify-center mr-3">
                            <ArrowDownCircle size={14} color={Colors.accent.DEFAULT} strokeWidth={2} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-sans-semibold text-kumo-default">
                              {e.name}
                            </Text>
                            <Text className="text-[10px] font-sans text-kumo-subtle">
                              {e.category}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-sm font-sans-semibold text-kumo-warning">
                          -{fmt(e.amount || 0)}
                        </Text>
                      </View>
                    ))}
                  <View className="flex-row justify-between pt-3">
                    <Text className="text-xs font-sans-semibold text-kumo-subtle">
                      Total Pengeluaran
                    </Text>
                    <Text className="text-xs font-sans-semibold text-kumo-warning">
                      {fmt(detailExpense)}
                    </Text>
                  </View>
                </View>
              )}

              {detailTxns.length === 0 && detailEntries.length === 0 && (
                <View className="items-center py-6">
                  <Text className="text-sm font-sans text-kumo-subtle">
                    Tidak ada transaksi pada shift ini
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SheetModal>
    </SafeAreaView>
  );
}
