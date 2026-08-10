import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserPlus, CheckCircle } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { createEmployee, getEmployees } from "@/services/auth";
import SheetModal from "@/components/ui/SheetModal";
import { Input } from "@/components/ui/Input";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "cashier";
  active: boolean;
};

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPin, setFormPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPin, setCreatedPin] = useState<string | null>(null);

  const loadEmployees = async () => {
    const data = await getEmployees();
    setEmployees(data);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

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
        formPin
      );
      setCreatedPin(formPin);
      setFormName("");
      setFormEmail("");
      setFormPin("");
      await loadEmployees();
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal membuat karyawan");
    }
    setIsSubmitting(false);
  };

  const activeCount = employees.filter((e) => e.active).length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-end justify-between">
        <View>
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
            Manajemen
          </Text>
          <Text
            className="text-2xl font-sans-extrabold text-foreground mt-1"
            style={{ letterSpacing: -0.5 }}
          >
            Karyawan
          </Text>
        </View>
        <Pressable
          className="bg-primary rounded-md px-4 py-3 flex-row items-center"
          onPress={() => setShowForm(true)}
        >
          <UserPlus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-sm font-sans-bold text-white ml-2">Tambah</Text>
        </Pressable>
      </View>

      {/* Summary */}
      <View className="px-6 py-4 flex-row gap-3">
        <View className="flex-1 bg-secondary-50 rounded-lg p-4">
          <Text className="text-2xl font-sans-extrabold text-secondary">
            {activeCount}
          </Text>
          <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">
            Aktif
          </Text>
        </View>
        <View className="flex-1 bg-muted rounded-lg p-4">
          <Text className="text-2xl font-sans-extrabold text-foreground">
            {employees.length}
          </Text>
          <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">
            Total Staf
          </Text>
        </View>
      </View>

      {/* Employee List */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-8"
      >
        {employees.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-base font-sans-medium text-gray-400">
              Belum ada karyawan
            </Text>
            <Text className="text-sm font-sans text-gray-400 mt-1">
              Tambah karyawan dengan tombol di atas
            </Text>
          </View>
        )}

        {employees.map((item) => {
          const isOwner = item.role === "owner";
          return (
            <View
              key={item.id}
              className="flex-row items-center py-4 border-b-2 border-muted"
            >
              <View
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  isOwner ? "bg-primary-100" : item.active ? "bg-secondary-100" : "bg-gray-200"
                }`}
              >
                <Text className="text-lg font-sans-bold text-foreground">
                  {item.name.charAt(0)}
                </Text>
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-sans-bold text-foreground">
                  {item.name}
                </Text>
                <Text className="text-xs font-sans text-gray-500 mt-0.5">
                  {item.email}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full mr-2 ${
                  isOwner ? "bg-primary-100" : "bg-muted"
                }`}
              >
                <Text
                  className={`text-xs font-sans-bold ${
                    isOwner ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {isOwner ? "Owner" : "Kasir"}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  item.active ? "bg-secondary-100" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-xs font-sans-bold ${
                    item.active ? "text-secondary" : "text-gray-500"
                  }`}
                >
                  {item.active ? "Aktif" : "Nonaktif"}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* SheetModal Tambah Karyawan */}
      <SheetModal
        visible={showForm}
        title="Tambah Karyawan"
        onClose={() => {
          setShowForm(false);
          setCreatedPin(null);
        }}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {createdPin ? (
            <View className="items-center py-8">
              <View className="w-16 h-16 rounded-full bg-secondary-100 items-center justify-center mb-4">
                <CheckCircle size={36} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
              </View>
              <Text className="text-xl font-sans-extrabold text-foreground text-center">
                Karyawan Berhasil Dibuat!
              </Text>
              <Text className="text-sm font-sans text-gray-500 mt-2 text-center">
                Berikan kredensial ini ke karyawan:
              </Text>
              <View className="bg-muted rounded-lg p-5 mt-6 w-full">
                <View className="flex-row items-center justify-between py-3 border-b-2 border-white/60">
                  <Text className="text-sm font-sans-semibold text-gray-500 uppercase tracking-wider">Email</Text>
                  <Text className="text-base font-sans-bold text-foreground">
                    {formEmail || "-"}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between py-3">
                  <Text className="text-sm font-sans-semibold text-gray-500 uppercase tracking-wider">PIN</Text>
                  <Text className="text-2xl font-sans-extrabold text-primary tracking-widest">
                    {createdPin}
                  </Text>
                </View>
              </View>
              <Pressable
                className="h-14 rounded-md bg-primary items-center justify-center mt-6 w-full"
                onPress={() => {
                  setShowForm(false);
                  setCreatedPin(null);
                }}
              >
                <Text className="text-lg font-sans-bold text-white">Selesai</Text>
              </Pressable>
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
              <Text className="text-xs font-sans text-gray-400 -mt-2 px-1">
                PIN ini digunakan karyawan untuk login
              </Text>

              <Pressable
                className={`h-14 rounded-md items-center justify-center mt-2 ${
                  isSubmitting ? "bg-primary-600" : "bg-primary"
                }`}
                onPress={handleCreate}
                disabled={isSubmitting}
              >
                <Text className="text-lg font-sans-bold text-white">
                  {isSubmitting ? "Membuat..." : "Buat Karyawan"}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SheetModal>
    </SafeAreaView>
  );
}
