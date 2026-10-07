import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserPlus, CheckCircle, ChevronRight } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { createEmployee } from "@/services/auth";
import SheetModal from "@/components/ui/SheetModal";
import { Input } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { usePayrollSettings } from "@/hooks/usePayrollSettings";
import EmployeeDetail from "@/components/admin/EmployeeDetail";
import { database } from "@/db";
import { sanitizeCurrency } from "@/utils/currency";
import { Q } from "@nozbe/watermelondb";
import Button from "@/components/ui/Button";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

type Employee = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "cashier";
  active: boolean;
  pin?: string;
  hourlyRate?: number;
};

export default function EmployeesScreen() {
  const { enabled: payrollEnabled } = usePayrollSettings();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPin, setFormPin] = useState("");
  const [formRate, setFormRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPin, setCreatedPin] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const sub = database
      .get("users")
      .query(
        Q.where("active", Q.eq(true)),
        Q.where("deleted_at", Q.eq(null))
      )
      .observe()
      .subscribe((records) => {
        setEmployees(records as any as Employee[]);
      });
    return () => sub.unsubscribe();
  }, []);

  const openForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPin("");
    setFormRate("");
    setCreatedPin(null);
    setShowForm(true);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPin.trim()) {
      Alert.alert("Error", "Semua field wajib diisi");
      return;
    }
    if (formPin.length < 4 || formPin.length > 6) {
      Alert.alert("Error", "PIN harus 4-6 digit");
      return;
    }

    setIsSubmitting(true);
    try {
      await createEmployee(
        formName.trim(),
        formEmail.trim().toLowerCase(),
        formPin,
        payrollEnabled && formRate ? sanitizeCurrency(formRate) : undefined
      );
      setCreatedPin(formPin);
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal membuat karyawan");
    }
    setIsSubmitting(false);
  };

  const handleEmployeePress = (emp: Employee) => {
    setSelectedEmployee(emp);
  };

  const activeCount = employees.filter((e) => e.active).length;

  return (
    <SafeAreaView className="flex-1 bg-kumo-base">
      <View className="px-6 pt-6 pb-2 flex-row items-end justify-between">
        <View>
          <Text className="text-sm font-sans-semibold text-kumo-subtle  ">
            Manajemen
          </Text>
          <Text
            className="text-2xl font-sans-semibold text-kumo-default mt-1"

          >
            Karyawan
          </Text>
        </View>
        <Button
          size="lg"
          className="h-12 px-4"
          icon={<UserPlus size={18} color="#FFFFFF" strokeWidth={2.5} />}
          onPress={openForm}
        >
          Tambah
        </Button>
      </View>

      <View className="px-6 py-4 flex-row gap-3">
        <View className="flex-1 bg-kumo-success-tint rounded-lg p-4">
          <Text className="text-2xl font-sans-semibold text-kumo-success">
            {activeCount}
          </Text>
          <Text className="text-xs font-sans-semibold text-kumo-subtle   mt-1">
            Aktif
          </Text>
        </View>
        <View className="flex-1 bg-kumo-base border border-kumo-hairline rounded-lg p-4">
          <Text className="text-2xl font-sans-semibold text-kumo-default">
            {employees.length}
          </Text>
          <Text className="text-xs font-sans-semibold text-kumo-subtle   mt-1">
            Total Staf
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-8"
      >
        {employees.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-base font-sans-medium text-kumo-subtle">
              Belum ada karyawan
            </Text>
            <Text className="text-sm font-sans text-kumo-subtle mt-1">
              Tambah karyawan dengan tombol di atas
            </Text>
          </View>
        )}

        {employees.map((item) => {
          const isOwner = item.role === "owner";
          return (
            <Pressable
              key={item.id}
              className="flex-row items-center py-4 border-b border-kumo-line active:bg-kumo-canvas"
              onPress={() => handleEmployeePress(item)}
            >
              <View
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  isOwner ? "bg-kumo-info-tint" : item.active ? "bg-kumo-success-tint" : "bg-kumo-fill"
                }`}
              >
                <Text className="text-lg font-sans-semibold text-kumo-default">
                  {item.name.charAt(0)}
                </Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-sans-semibold text-kumo-default">
                  {item.name}
                </Text>
                <View className="flex-row items-center gap-3 mt-0.5">
                  <Text className="text-xs font-sans text-kumo-subtle">
                    {item.email}
                  </Text>
                  {item.role !== "owner" && (
                    <Text className="text-xs font-sans-semibold text-kumo-brand">
                      PIN: {item.pin || "-"}
                    </Text>
                  )}
                  {payrollEnabled && item.hourlyRate != null && item.hourlyRate > 0 && (
                    <Text className="text-xs font-sans-semibold text-kumo-brand">
                      {fmt(item.hourlyRate)}/jam
                    </Text>
                  )}
                </View>
              </View>
              <View
                className={`px-3 py-1 rounded-full mr-2 ${
                  isOwner ? "bg-kumo-info-tint" : "bg-kumo-fill"
                }`}
              >
                <Text
                  className={`text-xs font-sans-semibold ${
                    isOwner ? "text-kumo-brand" : "text-kumo-subtle"
                  }`}
                >
                  {isOwner ? "Owner" : "Kasir"}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full mr-1 ${
                  item.active ? "bg-kumo-success-tint" : "bg-kumo-fill"
                }`}
              >
                <Text
                  className={`text-xs font-sans-semibold ${
                    item.active ? "text-kumo-success" : "text-kumo-subtle"
                  }`}
                >
                  {item.active ? "Aktif" : "Nonaktif"}
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.gray[300]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <SheetModal
        visible={showForm}
        title="Tambah Karyawan"
        onClose={() => setShowForm(false)}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {createdPin ? (
            <View className="items-center py-8">
              <View className="w-16 h-16 rounded-full bg-kumo-success-tint items-center justify-center mb-4">
                <CheckCircle size={36} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
              </View>
              <Text className="text-xl font-sans-semibold text-kumo-default text-center">
                Karyawan Berhasil Dibuat!
              </Text>
              <Text className="text-sm font-sans text-kumo-subtle mt-2 text-center">
                Berikan kredensial ini ke karyawan:
              </Text>
              <View className="bg-kumo-base border border-kumo-hairline rounded-lg p-5 mt-6 w-full">
                <View className="flex-row items-center justify-between py-3 border-b border-kumo-inverse/60">
                  <Text className="text-sm font-sans-semibold text-kumo-subtle  ">Email</Text>
                  <Text className="text-base font-sans-semibold text-kumo-default">
                    {formEmail || "-"}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between py-3">
                  <Text className="text-sm font-sans-semibold text-kumo-subtle  ">PIN</Text>
                  <Text className="text-2xl font-sans-semibold text-kumo-brand ">
                    {createdPin}
                  </Text>
                </View>
              </View>
              <Button
                fullWidth
                className="mt-6"
                onPress={() => setShowForm(false)}
              >
                Selesai
              </Button>
            </View>
          ) : (
            <View className="gap-4">
              <Input
                label="Nama"
                placeholder="Nama karyawan"
                value={formName}
                onChangeText={setFormName}
              />
              <Input
                label="Email"
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formEmail}
                onChangeText={setFormEmail}
              />
              <Input
                label="PIN (4-6 digit)"
                placeholder="1234"
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                value={formPin}
                onChangeText={setFormPin}
              />
              <Text className="text-xs font-sans text-kumo-subtle -mt-2 px-1">
                PIN ini digunakan karyawan untuk login
              </Text>

              {payrollEnabled && (
                <CurrencyInput
                  label="Upah per Jam (opsional)"
                  placeholder="15000"
                  value={formRate}
                  onValueChange={setFormRate}
                />
              )}

              <Button
                fullWidth
                size="lg"
                className="h-14 mt-2 rounded-md"
                textClassName="text-lg font-sans-semibold"
                onPress={handleCreate}
                loading={isSubmitting}
              >
                Simpan
              </Button>
            </View>
          )}
        </ScrollView>
      </SheetModal>

      <EmployeeDetail
        visible={!!selectedEmployee}
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </SafeAreaView>
  );
}
