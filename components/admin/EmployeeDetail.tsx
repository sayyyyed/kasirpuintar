import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  Clock,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Banknote,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { usePayrollSettings } from "@/hooks/usePayrollSettings";
import { getEmployeeShifts, updateEmployeeRate, createPayrollPeriod, getPayrollPeriods, markPayrollPaid } from "@/services/repositories/payrollRepository";
import SheetModal from "@/components/ui/SheetModal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

interface Props {
  visible: boolean;
  employee: { id: string; name: string; role: string; hourlyRate?: number } | null;
  onClose: () => void;
  onUpdate: () => void;
}

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const label = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return { start, end, label };
}

export default function EmployeeDetail({ visible, employee, onClose, onUpdate }: Props) {
  const { enabled } = usePayrollSettings();
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [editRate, setEditRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  const loadData = async () => {
    if (!employee) return;
    setLoading(true);
    const range = monthRange();
    try {
      const [shiftData, periodData] = await Promise.all([
        getEmployeeShifts(employee.id, range.start, range.end),
        getPayrollPeriods(employee.id, range.start, range.end),
      ]);
      setShifts(shiftData as any[]);
      setPeriods(periodData as any[]);
      setEditRate(employee.hourlyRate != null ? String(employee.hourlyRate) : "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && employee) loadData();
  }, [visible, employee?.id]);

  const range = monthRange();
  const totalHours = shifts.reduce((s: number, sh: any) => {
    if (!sh.clockOutAt) return s;
    return s + (sh.clockOutAt.getTime() - sh.clockInAt.getTime()) / 3_600_000;
  }, 0);
  const hourlyRate = employee?.hourlyRate ?? 0;
  const estimatedPay = Math.round(totalHours * hourlyRate);
  const daysWorked = shifts.filter((s: any) => s.status === "closed" || s.clockOutAt).length;

  const lastPending = periods
    .filter((p: any) => p.status === "pending")
    .sort((a: any, b: any) => (b.periodEnd?.getTime?.() ?? 0) - (a.periodEnd?.getTime?.() ?? 0))[0];

  const handleSaveRate = async () => {
    if (!employee) return;
    const rate = editRate ? Number(editRate) : null;
    setSavingRate(true);
    try {
      await updateEmployeeRate(employee.id, rate);
      onUpdate();
      if (employee.hourlyRate !== rate) {
        employee.hourlyRate = rate ?? undefined;
      }
    } catch {
      Alert.alert("Gagal", "Gagal menyimpan upah");
    } finally {
      setSavingRate(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!lastPending) return;
    Alert.alert("Konfirmasi", `Tandai gaji Rp ${fmt(lastPending.grossPay)} sebagai sudah dibayar?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Ya, Sudah Dibayar",
        onPress: async () => {
          await markPayrollPaid(lastPending.id);
          loadData();
        },
      },
    ]);
  };

  const handleCreatePeriod = async () => {
    if (!employee || hourlyRate <= 0) return;
    const range = monthRange();
    await createPayrollPeriod({
      userId: employee.id,
      periodStart: range.start,
      periodEnd: range.end,
      totalHours,
      hourlyRate,
      grossPay: estimatedPay,
    });
    loadData();
  };

  const formatDuration = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}j ${m}m`;
  };

  return (
    <SheetModal
      visible={visible}
      title={employee?.name || ""}
      onClose={onClose}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
          </View>
        ) : (
          <>
            {/* Role & Rate */}
            <View className="flex-row items-center justify-between mb-4 bg-muted rounded-lg p-4">
              <View>
                <Text className="text-xs font-sans-semibold text-gray-400 uppercase tracking-wider">
                  {employee?.role === "owner" ? "Owner" : "Kasir"}
                </Text>
                {enabled && (
                  <Text className="text-lg font-sans-extrabold text-foreground mt-1">
                    {hourlyRate > 0 ? fmt(hourlyRate) + "/jam" : "Upah belum diatur"}
                  </Text>
                )}
              </View>
              <View className={`w-12 h-12 rounded-full items-center justify-center ${
                employee?.role === "owner" ? "bg-primary-100" : "bg-secondary-100"
              }`}>
                <Banknote size={22} color={employee?.role === "owner" ? Colors.primary.DEFAULT : Colors.secondary.DEFAULT} strokeWidth={2.5} />
              </View>
            </View>

            {/* Edit Rate (only if payroll enabled) */}
            {enabled && (
              <View className="flex-row gap-2 items-end mb-4">
                <View className="flex-1">
                  <CurrencyInput
                    label="Upah per Jam"
                    placeholder="15000"
                    value={editRate}
                    onValueChange={setEditRate}
                  />
                </View>
                <Pressable
                  className={`h-14 rounded-md items-center justify-center px-5 ${savingRate ? "bg-gray-300" : "bg-primary"}`}
                  onPress={handleSaveRate}
                  disabled={savingRate}
                >
                  <Text className="text-sm font-sans-bold text-white">Simpan</Text>
                </Pressable>
              </View>
            )}

            {/* Monthly Summary */}
            {enabled && (
              <View className="bg-primary rounded-lg p-5 mb-4">
                <View className="absolute top-3 right-3 w-20 h-20 rounded-full bg-white opacity-5" />
                <Text className="text-xs font-sans-semibold text-white opacity-70 uppercase tracking-wider">
                  Ringkasan {range.label}
                </Text>
                <View className="flex-row gap-4 mt-3">
                  <View className="flex-1">
                    <Text className="text-2xl font-sans-extrabold text-white">
                      {daysWorked}
                    </Text>
                    <Text className="text-[10px] font-sans-medium text-white opacity-70 uppercase tracking-wider mt-1">
                      Hari Hadir
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-sans-extrabold text-white">
                      {totalHours.toFixed(1)}
                    </Text>
                    <Text className="text-[10px] font-sans-medium text-white opacity-70 uppercase tracking-wider mt-1">
                      Jam Kerja
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-sans-extrabold text-white">
                      {fmt(estimatedPay)}
                    </Text>
                    <Text className="text-[10px] font-sans-medium text-white opacity-70 uppercase tracking-wider mt-1">
                      Estimasi Gaji
                    </Text>
                  </View>
                </View>
                {hourlyRate > 0 && totalHours > 0 && (
                  <View className="flex-row gap-2 mt-4">
                    <Pressable
                      className="flex-1 h-12 rounded-md bg-white items-center justify-center"
                      onPress={handleCreatePeriod}
                    >
                      <Text className="text-sm font-sans-bold text-primary">
                        Simpan Periode
                      </Text>
                    </Pressable>
                    {lastPending && (
                      <Pressable
                        className="flex-1 h-12 rounded-md bg-secondary items-center justify-center"
                        onPress={handleMarkPaid}
                      >
                        <Text className="text-sm font-sans-bold text-white">
                          Tandai Dibayar
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Paid Periods */}
            {enabled && periods.filter((p: any) => p.status === "paid").length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-sans-bold text-gray-500 uppercase tracking-wider mb-2">
                  Riwayat Dibayar
                </Text>
                {periods
                  .filter((p: any) => p.status === "paid")
                  .map((p: any) => (
                    <View key={p.id} className="flex-row items-center justify-between py-2 border-b-2 border-muted">
                      <View className="flex-row items-center">
                        <CheckCircle size={16} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
                        <Text className="ml-2 text-xs font-sans-bold text-foreground">
                          {p.periodStart?.toLocaleDateString?.("id-ID", { day: "numeric", month: "short" }) ?? ""} – {p.periodEnd?.toLocaleDateString?.("id-ID", { day: "numeric", month: "short" }) ?? ""}
                        </Text>
                      </View>
                      <Text className="text-sm font-sans-bold text-secondary">
                        {fmt(p.grossPay || 0)}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Attendance List */}
            <Text className="text-sm font-sans-bold text-gray-500 uppercase tracking-wider mb-2">
              Kehadiran {range.label}
            </Text>
            {shifts.length === 0 ? (
              <View className="items-center py-6">
                <Calendar size={28} color={Colors.gray[300]} strokeWidth={1.5} />
                <Text className="text-sm font-sans text-gray-400 mt-2">
                  Belum ada shift bulan ini
                </Text>
              </View>
            ) : (
              shifts.map((sh: any) => {
                const closed = sh.status === "closed" || sh.clockOutAt;
                const duration = closed
                  ? (sh.clockOutAt?.getTime?.() ?? Date.now()) - (sh.clockInAt?.getTime?.() ?? Date.now())
                  : 0;
                const dayPay = hourlyRate > 0 ? Math.round((duration / 3_600_000) * hourlyRate) : 0;

                return (
                  <View key={sh.id} className="flex-row items-center py-3 border-b-2 border-muted">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      closed ? "bg-secondary-100" : "bg-accent-100"
                    }`}>
                      {closed ? (
                        <CheckCircle size={18} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
                      ) : (
                        <Clock size={18} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-sans-bold text-foreground">
                        {sh.clockInAt?.toLocaleDateString?.("id-ID", { weekday: "long", day: "numeric", month: "short" })}
                      </Text>
                      <Text className="text-xs font-sans text-gray-500 mt-0.5">
                        {sh.clockInAt?.toLocaleTimeString?.("id-ID", { hour: "2-digit", minute: "2-digit" })} – {closed ? sh.clockOutAt?.toLocaleTimeString?.("id-ID", { hour: "2-digit", minute: "2-digit" }) : "sekarang"}
                      </Text>
                      {closed && (
                        <Text className="text-[10px] font-sans text-gray-400 mt-0.5">
                          {formatDuration(duration)}
                          {enabled && hourlyRate > 0 && ` · ${fmt(dayPay)}`}
                        </Text>
                      )}
                    </View>
                    {!closed && (
                      <View className="px-3 py-1 rounded-full bg-accent-100">
                        <Text className="text-xs font-sans-bold text-accent">Aktif</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SheetModal>
  );
}
