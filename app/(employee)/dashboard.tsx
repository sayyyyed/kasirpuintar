import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Timer,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  LogOut,
  ChevronRight,
  Play,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import { Badge } from "@/components/ui/Badge";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useShift } from "@/hooks/useShift";
import { verifyPin } from "@/services/auth";
import { clockIn, clockOut } from "@/services/repositories/shiftRepository";
import { getTransactionsByShift } from "@/services/repositories/transactionRepository";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { shift, formattedTime } = useShift(user?.id || "");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isClocking, setIsClocking] = useState(false);
  const [todayTxns, setTodayTxns] = useState<any[]>([]);

  const loadTodayTxns = async () => {
    if (!shift?.id) return;
    const txns = await getTransactionsByShift(shift.id);
    setTodayTxns(txns || []);
  };

  useEffect(() => {
    loadTodayTxns();
    const interval = setInterval(loadTodayTxns, 10000);
    return () => clearInterval(interval);
  }, [shift?.id]);

  const todayRevenue = txnsToTotal(todayTxns);
  const todayCount = todayTxns.length;
  const todayItems = todayTxns.reduce(
    (sum, t) => sum + (t.items?.length || 0),
    0
  );

  const handleClockIn = async () => {
    if (!user) return;
    setIsClocking(true);
    const valid = await verifyPin(user.id, pinInput);
    setIsClocking(false);
    if (!valid) {
      setPinError("PIN salah");
      return;
    }
    setPinInput("");
    setPinError("");
    setShowPinModal(false);

    await clockIn({ userId: user.id, openingCash: 0 });
  };

  const handleClockOut = async () => {
    if (!shift?.id) return;
    setIsClocking(true);
    const valid = await verifyPin(user?.id || "", pinInput);
    setIsClocking(false);
    if (!valid) {
      setPinError("PIN salah");
      return;
    }
    setPinInput("");
    setPinError("");
    setShowPinModal(false);

    await clockOut(shift.id, 0);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const openClockIn = () => {
    setPinInput("");
    setPinError("");
    setShowPinModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 flex-row items-end justify-between">
          <View>
            <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
              Selamat Datang
            </Text>
            <Text
              className="text-3xl font-sans-extrabold text-foreground mt-1"
              style={{ letterSpacing: -0.6 }}
            >
              {user?.name || "Kasir"}
            </Text>
            <Badge variant={shift ? "secondary" : "muted"}>
              {shift ? "Shift Aktif" : "Belum Shift"}
            </Badge>
          </View>
          <Pressable onPress={handleLogout}>
            <LogOut size={22} color="#EF4444" strokeWidth={2.5} />
          </Pressable>
        </View>

        {!shift ? (
          /* No active shift */
          <View className="px-6 mb-6">
            <View className="bg-muted rounded-lg p-8 items-center">
              <Play size={32} color={Colors.primary.DEFAULT} strokeWidth={2} />
              <Text className="text-base font-sans-bold text-foreground mt-4 text-center">
                Belum ada shift aktif
              </Text>
              <Text className="text-sm font-sans text-gray-500 mt-1 text-center">
                Masukkan PIN untuk memulai shift
              </Text>
              <Pressable
                className="h-14 rounded-md bg-primary items-center justify-center mt-6 px-8"
                onPress={openClockIn}
              >
                <Text className="text-base font-sans-bold text-white">
                  Mulai Shift
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Active shift */
          <>
            {/* Shift Timer Card */}
            <View className="px-6 mb-6">
              <View className="bg-primary rounded-lg p-6">
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
                  Mulai pukul{" "}
                  {shift?.clock_in_at
                    ? new Date(shift.clock_in_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}{" "}
                  WIB
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View className="px-6 mb-6">
              <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
                Shift Ini
              </Text>
              <View className="flex-row gap-3">
                <Card color="blue" className="flex-1">
                  <IconCircle color="primary" size="sm">
                    <DollarSign
                      size={18}
                      color={Colors.primary.DEFAULT}
                      strokeWidth={2.5}
                    />
                  </IconCircle>
                  <Text
                    className="text-2xl font-sans-bold text-foreground mt-3"
                    style={{ letterSpacing: -0.5 }}
                  >
                    {fmt(todayRevenue)}
                  </Text>
                  <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider mt-1">
                    Pendapatan
                  </Text>
                </Card>

                <View className="gap-3 flex-1">
                  <Card color="green" className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-2xl font-sans-bold text-foreground"
                        style={{ letterSpacing: -0.5 }}
                      >
                        {todayCount}
                      </Text>
                      <IconCircle color="secondary" size="sm">
                        <ShoppingCart
                          size={16}
                          color={Colors.secondary.DEFAULT}
                          strokeWidth={2.5}
                        />
                      </IconCircle>
                    </View>
                    <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider mt-1">
                      Transaksi
                    </Text>
                  </Card>
                  <Card color="amber" className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-2xl font-sans-bold text-foreground"
                        style={{ letterSpacing: -0.5 }}
                      >
                        {todayItems}
                      </Text>
                      <IconCircle color="accent" size="sm">
                        <TrendingUp
                          size={16}
                          color={Colors.accent.DEFAULT}
                          strokeWidth={2.5}
                        />
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
                  <ShoppingCart
                    size={18}
                    color={Colors.primary.DEFAULT}
                    strokeWidth={2}
                  />
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
              <Pressable
                className="h-14 rounded-md items-center justify-center border-4 border-red-500 flex-row"
                onPress={openClockIn}
              >
                <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
                <Text className="ml-2 text-base font-sans-bold text-red-500">
                  Akhiri Shift
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPinModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <View className="bg-white rounded-lg p-6 w-full">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-sans-bold text-foreground">
              Verifikasi PIN
            </Text>
            <Pressable
              className="w-8 h-8 items-center justify-center"
              onPress={() => setShowPinModal(false)}
            >
              <X size={20} color={Colors.gray[500]} strokeWidth={2} />
            </Pressable>
          </View>
          <TextInput
            className="h-14 border-2 border-muted rounded-md px-4 text-2xl font-sans-bold text-center text-foreground tracking-widest"
            placeholder="****"
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
            value={pinInput}
            onChangeText={setPinInput}
            autoFocus
          />
          {pinError !== "" && (
            <Text className="text-sm text-red-500 font-sans-medium text-center mt-2">
              {pinError}
            </Text>
          )}
          <Pressable
            className={`h-12 rounded-md items-center justify-center mt-4 ${
              isClocking ? "bg-gray-300" : "bg-primary"
            }`}
            onPress={shift ? handleClockOut : handleClockIn}
            disabled={isClocking || pinInput.length === 0}
          >
            <Text className="text-base font-sans-bold text-white">
              {isClocking ? "..." : shift ? "Akhiri Shift" : "Mulai Shift"}
            </Text>
          </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function txnsToTotal(txns: any[]) {
  return txns.reduce((sum, t) => sum + (t.total || 0), 0);
}
