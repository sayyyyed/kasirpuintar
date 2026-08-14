import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
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
  Clock,
  Banknote,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import { Badge } from "@/components/ui/Badge";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useShift } from "@/hooks/useShift";
import { usePayrollSettings } from "@/hooks/usePayrollSettings";
import { useEmployeeTab } from "@/hooks/useEmployeeTab";
import { clockIn, clockOut } from "@/services/repositories/shiftRepository";
import { getTransactionsByShift } from "@/services/repositories/transactionRepository";
import { database } from "@/db";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function EmployeeDashboard() {
  const router = useRouter();
  const { goTo } = useEmployeeTab();
  const { user, signOut } = useAuth();
  const { shift, formattedTime, elapsed } = useShift(user?.id || "");
  const { enabled: payrollEnabled } = usePayrollSettings();
  const [isClocking, setIsClocking] = useState(false);
  const [todayTxns, setTodayTxns] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hourlyRate, setHourlyRate] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id) {
      database.get("users").find(user.id).then((u: any) => {
        setHourlyRate(u.hourlyRate ?? 0);
      }).catch(() => {});
    }
  }, [user?.id]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [currentTime]);

  const formattedClock = useMemo(() => {
    return currentTime.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [currentTime]);

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
    try {
      await clockIn({ userId: user.id, openingCash: 0 });
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal memulai shift");
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = () => {
    if (!shift?.id) return;
    Alert.alert(
      "Akhiri Shift",
      "Apakah Anda yakin akan mengakhiri shift?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Akhiri",
          style: "destructive",
          onPress: async () => {
            setIsClocking(true);
            try {
              await clockOut(shift.id, 0);
            } catch (err: any) {
              Alert.alert("Gagal", err.message || "Gagal mengakhiri shift");
            } finally {
              setIsClocking(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
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

        {/* Live Clock Display */}
        <View className="px-6 pb-2">
          <View className="bg-muted rounded-lg p-5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                <Clock size={18} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
              </View>
              <View className="ml-3">
                <Text className="text-[10px] font-sans-bold text-gray-400 uppercase tracking-wider">
                  Jam Kerja Lokal
                </Text>
                <Text className="text-sm font-sans-bold text-foreground mt-0.5">
                  {formattedDate}
                </Text>
              </View>
            </View>
            <View className="bg-primary px-4 py-2 rounded-md">
              <Text className="text-base font-sans-extrabold text-white tracking-wider">
                {formattedClock}
              </Text>
            </View>
          </View>
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
                Tekan tombol di bawah untuk memulai shift
              </Text>
              <Pressable
                className="h-14 rounded-md bg-primary items-center justify-center mt-6 px-8"
                onPress={handleClockIn}
                disabled={isClocking}
              >
                <Text className="text-base font-sans-bold text-white">
                  {isClocking ? "Memulai..." : "Mulai Shift"}
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
                  className="text-4xl font-sans-extrabold text-white"
                  style={{ letterSpacing: -1.5 }}
                >
                  {formattedTime}
                </Text>
                <Text className="text-sm font-sans text-white opacity-60 mt-2">
                  Mulai pukul{" "}
                  {shift?.clockInAt
                    ? shift.clockInAt.toLocaleTimeString("id-ID", {
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
                onPress={() => goTo(1)}
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

            {/* Payroll Card */}
            {payrollEnabled && shift && hourlyRate > 0 && (
              <View className="px-6 mb-6">
                <View className="bg-secondary-50 rounded-lg p-4 flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-secondary-100 items-center justify-center mr-4">
                    <Banknote size={22} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-sans-semibold text-gray-400 uppercase tracking-wider">
                      Estimasi Gaji Shift Ini
                    </Text>
                    <Text className="text-xl font-sans-extrabold text-secondary mt-0.5">
                      {fmt(Math.round((elapsed / 3600) * hourlyRate))}
                    </Text>
                    <Text className="text-[10px] font-sans text-gray-500 mt-0.5">
                      {fmt(hourlyRate)}/jam · {Math.floor(elapsed / 3600)}j {Math.floor((elapsed % 3600) / 60)}m kerja
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Clock Out */}
            <View className="px-6">
              <Pressable
                className="h-14 rounded-md items-center justify-center border-4 border-red-500 flex-row"
                onPress={handleClockOut}
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
    </SafeAreaView>
  );
}

function txnsToTotal(txns: any[]) {
  return txns.reduce((sum, t) => sum + (t.total || 0), 0);
}
