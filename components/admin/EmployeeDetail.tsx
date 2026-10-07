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
import { sanitizeCurrency } from "@/utils/currency";
import { Input } from "@/components/ui/Input";
import { updateEmployeePin } from "@/services/auth";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

interface Props {
  visible: boolean;
  employee: { id: string; name: string; role: string; pin?: string; hourlyRate?: number } | null;
  onClose: () => void;
  onUpdate?: () => void;
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
  const [editPin, setEditPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [savedPin, setSavedPin] = useState<string | null>(null);

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
      setEditPin("");
      setSavedPin(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePin = async () => {
    if (!employee) return;
    const normalizedPin = editPin.replace(/\D/g, "");
    if (normalizedPin.length < 4 || normalizedPin.length > 6) {
      Alert.alert("Error", "PIN harus 4-6 digit");
      return;
    }

    setSavingPin(true);
    try {
      const newPin = await updateEmployeePin(employee.id, normalizedPin);
      setEditPin("");
      setSavedPin(newPin);
      Alert.alert("Berhasil", "PIN baru sudah tersimpan");
      onUpdate?.();
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal mengubah PIN");
    } finally {
      setSavingPin(false);
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
    const rate = editRate ? sanitizeCurrency(editRate) : null;
    setSavingRate(true);
    try {
      await updateEmployeeRate(employee.id, rate);
      if (employee.hourlyRate !== rate) {
        employee.hourlyRate = rate ?? undefined;
      }
      onUpdate?.();
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
            <View className="flex-row items-center justify-between mb-4 bg-kumo-base border border-kumo-hairline rounded-lg p-4">
              <View>
                <Text className="text-xs font-sans-semibold text-kumo-subtle  ">
                  {employee?.role === "owner" ? "Owner" : "Kasir"}
                </Text>
                {enabled && (
                  <Text className="text-lg font-sans-semibold text-kumo-default mt-1">
                    {hourlyRate > 0 ? fmt(hourlyRate) + "/jam" : "Upah belum diatur"}
                  </Text>
                )}
              </View>
              <View className={`w-12 h-12 rounded-full items-center justify-center ${
                employee?.role === "owner" ? "bg-kumo-info-tint" : "bg-kumo-success-tint"
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
                  className={`h-14 rounded-md items-center justify-center px-5 ${savingRate ? "bg-kumo-fill" : "bg-kumo-brand"}`}
                  onPress={handleSaveRate}
                  disabled={savingRate}
                >
                  <Text className="text-sm font-sans-semibold text-kumo-inverse">Simpan</Text>
                </Pressable>
              </View>
            )}

            {/* PIN hanya dapat diganti, bukan dibaca dari hash */}
            <View className="bg-kumo-base border border-kumo-hairline rounded-lg p-4 mb-4">
              <Text className="text-sm font-sans-semibold text-kumo-default">
                PIN Login
              </Text>
              {employee?.role !== "owner" && (
                <Text className="text-base font-sans-semibold text-kumo-brand mt-1">
                  PIN saat ini: {employee?.pin || "Belum tersimpan"}
                </Text>
              )}
              <Text className="text-xs font-sans text-kumo-subtle mt-1 mb-3">
                PIN lama tidak dapat ditampilkan. Buat PIN baru untuk menggantinya.
              </Text>
              <View className="flex-row gap-2 items-end">
                <View className="flex-1">
                  <Input
                    label="PIN Baru (4-6 digit)"
                    value={editPin}
                    onChangeText={(value) => setEditPin(value.replace(/\D/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    placeholder="Masukkan PIN baru"
                  />
                </View>
                <Pressable
                  className={`h-12 rounded-md items-center justify-center px-4 ${savingPin ? "bg-kumo-fill" : "bg-kumo-brand"}`}
                  onPress={handleSavePin}
                  disabled={savingPin}
                >
                  <Text className="text-sm font-sans-semibold text-kumo-inverse">
                    {savingPin ? "Menyimpan..." : "Ganti PIN"}
                  </Text>
                </Pressable>
              </View>
              {savedPin && (
                <Text className="text-sm font-sans-semibold text-kumo-success mt-3">
                  PIN baru: {savedPin}
                </Text>
              )}
            </View>

            {/* Monthly Summary */}
            {enabled && (
              <View className="bg-kumo-brand rounded-lg p-5 mb-4">
                <View className="absolute top-3 right-3 w-20 h-20 rounded-full bg-kumo-base opacity-5" />
                <Text className="text-xs font-sans-semibold text-kumo-inverse opacity-70  ">
                  Ringkasan {range.label}
                </Text>
                <View className="flex-row gap-4 mt-3">
                  <View className="flex-1">
                    <Text className="text-2xl font-sans-semibold text-kumo-inverse">
                      {daysWorked}
                    </Text>
                    <Text className="text-[10px] font-sans-medium text-kumo-inverse opacity-70   mt-1">
                      Hari Hadir
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-sans-semibold text-kumo-inverse">
                      {totalHours.toFixed(1)}
                    </Text>
                    <Text className="text-[10px] font-sans-medium text-kumo-inverse opacity-70   mt-1">
                      Jam Kerja
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-sans-semibold text-kumo-inverse">
                      {fmt(estimatedPay)}
                    </Text>
                    <Text className="text-[10px] font-sans-medium text-kumo-inverse opacity-70   mt-1">
                      Estimasi Gaji
                    </Text>
                  </View>
                </View>
                {hourlyRate > 0 && totalHours > 0 && (
                  <View className="flex-row gap-2 mt-4">
                    <Pressable
                      className="flex-1 h-12 rounded-md bg-kumo-base items-center justify-center"
                      onPress={handleCreatePeriod}
                    >
                      <Text className="text-sm font-sans-semibold text-kumo-brand">
                        Simpan Periode
                      </Text>
                    </Pressable>
                    {lastPending && (
                      <Pressable
                        className="flex-1 h-12 rounded-md bg-kumo-success items-center justify-center"
                        onPress={handleMarkPaid}
                      >
                        <Text className="text-sm font-sans-semibold text-kumo-inverse">
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
                <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-2">
                  Riwayat Dibayar
                </Text>
                {periods
                  .filter((p: any) => p.status === "paid")
                  .map((p: any) => (
                    <View key={p.id} className="flex-row items-center justify-between py-2 border-b border-kumo-line">
                      <View className="flex-row items-center">
                        <CheckCircle size={16} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
                        <Text className="ml-2 text-xs font-sans-semibold text-kumo-default">
                          {p.periodStart?.toLocaleDateString?.("id-ID", { day: "numeric", month: "short" }) ?? ""} – {p.periodEnd?.toLocaleDateString?.("id-ID", { day: "numeric", month: "short" }) ?? ""}
                        </Text>
                      </View>
                      <Text className="text-sm font-sans-semibold text-kumo-success">
                        {fmt(p.grossPay || 0)}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Attendance List */}
            <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-2">
              Kehadiran {range.label}
            </Text>
            {shifts.length === 0 ? (
              <View className="items-center py-6">
                <Calendar size={28} color={Colors.gray[300]} strokeWidth={1.5} />
                <Text className="text-sm font-sans text-kumo-subtle mt-2">
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
                  <View key={sh.id} className="flex-row items-center py-3 border-b border-kumo-line">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      closed ? "bg-kumo-success-tint" : "bg-kumo-warning-tint"
                    }`}>
                      {closed ? (
                        <CheckCircle size={18} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
                      ) : (
                        <Clock size={18} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-sans-semibold text-kumo-default">
                        {sh.clockInAt?.toLocaleDateString?.("id-ID", { weekday: "long", day: "numeric", month: "short" })}
                      </Text>
                      <Text className="text-xs font-sans text-kumo-subtle mt-0.5">
                        {sh.clockInAt?.toLocaleTimeString?.("id-ID", { hour: "2-digit", minute: "2-digit" })} – {closed ? sh.clockOutAt?.toLocaleTimeString?.("id-ID", { hour: "2-digit", minute: "2-digit" }) : "sekarang"}
                      </Text>
                      {closed && (
                        <Text className="text-[10px] font-sans text-kumo-subtle mt-0.5">
                          {formatDuration(duration)}
                          {enabled && hourlyRate > 0 && ` · ${fmt(dayPay)}`}
                        </Text>
                      )}
                    </View>
                    {!closed && (
                      <View className="px-3 py-1 rounded-full bg-kumo-warning-tint">
                        <Text className="text-xs font-sans-semibold text-kumo-warning">Aktif</Text>
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
