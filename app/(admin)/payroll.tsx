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
  Clock,
  Users,
  CheckCircle,
  Clock4,
  ChevronRight,
  Settings,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { database } from "@/db";
import { getPayrollPeriods, createPayrollPeriod, markPayrollPaid } from "@/services/repositories/payrollRepository";
import { usePayrollSettings } from "@/hooks/usePayrollSettings";
import EmployeeDetail from "@/components/admin/EmployeeDetail";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const label = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return { start, end, label };
}

export default function PayrollScreen() {
  const { enabled: payrollEnabled } = usePayrollSettings();
  const [employees, setEmployees] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!payrollEnabled) return;
    const range = monthRange();

    const [emps, per] = await Promise.all([
      database.get("users").query(
        Q.where("active", Q.eq(true)),
        Q.where("deleted_at", Q.eq(null)),
      ).fetch(),
      getPayrollPeriods(undefined, range.start, range.end),
    ]);
    setEmployees(emps as any[]);
    setPeriods(per as any[]);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const range = monthRange();

  // Hitung jam per karyawan dari periods
  const empPayroll = employees.map((emp: any) => {
    const empPeriods = periods.filter((p: any) => p.userId === emp.id);
    const pending = empPeriods.find((p: any) => p.status === "pending");
    const paid = empPeriods.filter((p: any) => p.status === "paid");
    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      hourlyRate: emp.hourlyRate,
      pending,
      paid,
      totalPaid: paid.reduce((s: number, p: any) => s + (p.grossPay || 0), 0),
    };
  });

  const totalPayroll = empPayroll.reduce((s: number, e: any) => {
    return s + (e.pending?.grossPay || 0) + e.totalPaid;
  }, 0);
  const pendingCount = empPayroll.filter((e: any) => e.pending).length;
  const paidCount = empPayroll.filter((e: any) => e.paid.length > 0).length;

  if (!payrollEnabled) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="items-center px-8">
          <View className="w-20 h-20 rounded-full bg-muted items-center justify-center mb-6">
            <Settings size={36} color={Colors.gray[300]} strokeWidth={1.5} />
          </View>
          <Text className="text-lg font-sans-bold text-foreground text-center">
            Sistem Upah Belum Diaktifkan
          </Text>
          <Text className="text-sm font-sans text-gray-400 text-center mt-2">
            Aktifkan di tab Atur → Keuangan → Sistem Upah untuk mulai menghitung gaji karyawan.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.DEFAULT]} />}
      >
        <View className="px-6 pt-6 pb-2">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
            Keuangan
          </Text>
          <Text
            className="text-3xl font-sans-extrabold text-foreground mt-1"
            style={{ letterSpacing: -0.6 }}
          >
            Penggajian
          </Text>
          <Text className="text-sm font-sans text-gray-500 mt-1">
            {range.label}
          </Text>
        </View>

        {/* Summary Card */}
        <View className="px-6 mt-4">
          <View className="bg-primary rounded-lg p-5">
            <View className="absolute top-3 right-3 w-24 h-24 rounded-full bg-white opacity-5" />
            <View className="absolute bottom-4 right-16 w-12 h-12 rounded-lg bg-white opacity-5 rotate-45" />
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-sans-semibold text-white opacity-80 uppercase tracking-wider">
                  Total Penggajian
                </Text>
                <Text
                  className="text-3xl font-sans-extrabold text-white mt-2"
                  style={{ letterSpacing: -0.8 }}
                >
                  {fmt(totalPayroll)}
                </Text>
                <View className="flex-row gap-4 mt-2">
                  <View className="flex-row items-center">
                    <Clock4 size={12} color="#FFFFFF" opacity={0.7} />
                    <Text className="text-xs font-sans-medium text-white opacity-70 ml-1">
                      {pendingCount} pending
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <CheckCircle size={12} color="#FFFFFF" opacity={0.7} />
                    <Text className="text-xs font-sans-medium text-white opacity-70 ml-1">
                      {paidCount} paid
                    </Text>
                  </View>
                </View>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center">
                <DollarSign size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          </View>
        </View>

        {/* Employee Payroll List */}
        <View className="px-6 mt-8">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Per Karyawan
          </Text>
          {empPayroll.length === 0 ? (
            <View className="items-center py-8">
              <Users size={32} color={Colors.gray[300]} strokeWidth={1.5} />
              <Text className="text-sm font-sans-medium text-gray-400 mt-3">
                Belum ada karyawan
              </Text>
            </View>
          ) : (
            empPayroll.map((emp: any) => (
              <Pressable
                key={emp.id}
                className="bg-muted rounded-lg p-4 mb-3 active:bg-gray-200"
                onPress={() => setSelectedEmp(emp)}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      emp.role === "owner" ? "bg-primary-100" : "bg-secondary-100"
                    }`}>
                      <Text className="text-base font-sans-bold text-foreground">
                        {emp.name?.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-base font-sans-bold text-foreground">
                        {emp.name}
                      </Text>
                      <Text className="text-xs font-sans text-gray-500">
                        {emp.role === "owner" ? "Owner" : "Kasir"}
                        {emp.hourlyRate > 0 ? ` · ${fmt(emp.hourlyRate)}/jam` : ""}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={Colors.gray[400]} />
                </View>

                {emp.pending ? (
                  <View className="flex-row gap-3">
                    <View className="flex-1 bg-white rounded-md p-3">
                      <Text className="text-[10px] font-sans-semibold text-gray-400 uppercase tracking-wider">
                        Jam Kerja
                      </Text>
                      <Text className="text-sm font-sans-bold text-foreground mt-0.5">
                        {emp.pending.totalHours}j
                      </Text>
                    </View>
                    <View className="flex-1 bg-white rounded-md p-3">
                      <Text className="text-[10px] font-sans-semibold text-gray-400 uppercase tracking-wider">
                        Gaji
                      </Text>
                      <Text className="text-sm font-sans-bold text-primary mt-0.5">
                        {fmt(emp.pending.grossPay)}
                      </Text>
                    </View>
                    <View className="flex-1 bg-accent-100 rounded-md p-3 items-center justify-center">
                      <Clock size={14} color={Colors.accent.DEFAULT} />
                      <Text className="text-[10px] font-sans-bold text-accent mt-1">
                        Pending
                      </Text>
                    </View>
                  </View>
                ) : emp.paid.length > 0 ? (
                  <View className="bg-secondary-50 rounded-md p-3 flex-row items-center">
                    <CheckCircle size={16} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
                    <Text className="ml-2 text-sm font-sans-bold text-secondary">
                      Sudah dibayar ({emp.paid.length} periode)
                    </Text>
                  </View>
                ) : (
                  <View className="bg-muted rounded-md p-3">
                    <Text className="text-xs font-sans text-gray-400 text-center">
                      {emp.hourlyRate > 0 ? "Belum ada data shift bulan ini" : "Upah belum diatur"}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <EmployeeDetail
        visible={!!selectedEmp}
        employee={selectedEmp}
        onClose={() => setSelectedEmp(null)}
        onUpdate={() => loadData()}
      />
    </SafeAreaView>
  );
}
