import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Switch, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Printer,
  Wifi,
  Database,
  Bell,
  Shield,
  ChevronRight,
  Smartphone,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  Trash2,
  DollarSign,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import {
  getSyncSettings,
  setAutoSyncEnabled,
  setOfflineModeEnabled,
  syncAll,
  startAutoSync,
  stopAutoSync,
} from "@/services/sync";
import { useAuth } from "@/hooks/useAuth";
import { usePayrollSettings } from "@/hooks/usePayrollSettings";
import { database } from "@/db";
import { getAppSettings, saveAppSettings, type AppSettings } from "@/services/appSettings";

type SettingItemProps = {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  showArrow?: boolean;
};

function SettingItem({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  onToggle,
  onPress,
  showArrow = false,
}: SettingItemProps) {
  return (
    <Pressable
      className="flex-row items-center py-4 border-b border-kumo-line"
      onPress={onPress}
    >
      <View className={`w-12 h-12 rounded-lg items-center justify-center ${iconBg}`}>
        {icon}
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-base font-sans-semibold text-kumo-default">{title}</Text>
        <Text className="text-xs font-sans text-kumo-subtle mt-0.5">{subtitle}</Text>
      </View>
      {onToggle !== undefined ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: Colors.gray[300], true: Colors.primary.DEFAULT }}
          thumbColor="#FFFFFF"
        />
      ) : showArrow ? (
        <ChevronRight size={20} color={Colors.gray[400]} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { isOnline, lastSyncFormatted, outboxPending } = useSyncStatus();
  const [autoSync, setAutoSync] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const { enabled: payrollEnabled, toggle: togglePayroll } = usePayrollSettings();

  React.useEffect(() => {
    getSyncSettings().then(({ autoSync: storedAutoSync, offlineMode: storedOfflineMode }) => {
      setAutoSync(storedAutoSync);
      setOfflineMode(storedOfflineMode);
    });
  }, []);

  React.useEffect(() => {
    getAppSettings().then(setAppSettings);
  }, []);

  const toggleAutoSync = useCallback(
    async (value: boolean) => {
      setAutoSync(value);
      await setAutoSyncEnabled(value);
      if (value) {
        if (!offlineMode) startAutoSync();
      } else {
        stopAutoSync();
      }
    },
    [offlineMode]
  );

  const toggleOfflineMode = useCallback(
    async (value: boolean) => {
      setOfflineMode(value);
      await setOfflineModeEnabled(value);
      if (value) {
        stopAutoSync();
      } else if (autoSync) {
        startAutoSync();
        await syncAll();
      }
    },
    [autoSync]
  );

  const handleSyncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const failed = await syncAll();
      if (failed > 0) {
        Alert.alert(
          "Sebagian Gagal",
          `${failed} perubahan belum terkirim ke server. Periksa koneksi & sesi lalu sync lagi.`
        );
      } else {
        Alert.alert("Sukses", "Sinkronisasi selesai");
      }
    } catch {
      Alert.alert("Gagal", "Sinkronisasi gagal, coba lagi");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.replace("/(auth)/login");
  }, []);

  const handlePurgeOutbox = useCallback(() => {
    Alert.alert(
      "Bersihkan Outbox",
      "Hapus semua item antrean sync yang gagal? Data lokal tetap aman.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const items = await database.get("sync_outbox").query().fetch();
            for (const item of items) {
              await database.write(async () => {
                await item.destroyPermanently();
              });
            }
            Alert.alert("Sukses", `${items.length} item outbox dihapus.`);
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-kumo-base">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-sm font-sans-semibold text-kumo-subtle  ">
            Konfigurasi
          </Text>
          <Text
            className="text-2xl font-sans-semibold text-kumo-default mt-1"

          >
            Pengaturan
          </Text>
        </View>

        {appSettings && (
          <View className="px-6 mb-6">
            <Text className="text-sm font-sans-semibold text-kumo-subtle mb-3">Tampilan</Text>
            <View className="bg-kumo-base border border-kumo-hairline rounded-lg px-4">
              <View className="py-4 border-b border-kumo-line">
                <Text className="text-base font-sans-semibold text-kumo-default mb-2">Nama toko</Text>
                <TextInput
                  className="bg-kumo-control border border-kumo-line rounded-lg px-3 h-11 text-base text-kumo-default font-sans"
                  value={appSettings.storeName}
                  onChangeText={(storeName) => setAppSettings({ ...appSettings, storeName })}
                  onBlur={() => saveAppSettings(appSettings)}
                  placeholder="Nama toko"
                />
              </View>
            </View>
          </View>
        )}

        {/* Printer Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-3">
            Printer
          </Text>
          <Pressable className="bg-kumo-base border border-kumo-hairline rounded-lg p-4" onPress={() => router.push("/printer-settings")}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-kumo-info-tint items-center justify-center">
                  <Printer size={22} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
                </View>
                <View className="ml-4">
                  <Text className="text-base font-sans-semibold text-kumo-default">
                    Printer Thermal
                  </Text>
                  <Text className="text-xs font-sans text-kumo-subtle">
                    Atur koneksi, layout, dan ukuran struk
                  </Text>
                </View>
              </View>
              <View className="px-3 py-1 bg-kumo-success-tint rounded-full">
                <Text className="text-xs font-sans-semibold text-kumo-success">Siap</Text>
              </View>
            </View>
            <View className="h-12 rounded-md bg-kumo-brand items-center justify-center">
              <Text className="text-base font-sans-semibold text-kumo-inverse">Atur Printer</Text>
            </View>
          </Pressable>
        </View>

        {/* Sync Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-3">
            Sinkronisasi
          </Text>

          <View className="bg-kumo-base border border-kumo-hairline rounded-lg p-4 mb-3">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-kumo-info-tint items-center justify-center">
                  {isOnline ? (
                    <Cloud size={20} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
                  ) : (
                    <CloudOff size={20} color={Colors.gray[400]} strokeWidth={2.5} />
                  )}
                </View>
                <View className="ml-3">
                  <Text className="text-sm font-sans-semibold text-kumo-default">
                    {isOnline ? "Online" : "Offline"}
                  </Text>
                  <Text className="text-xs font-sans text-kumo-subtle">
                    Sync terakhir: {lastSyncFormatted}
                  </Text>
                </View>
              </View>
              {outboxPending > 0 && (
                <View className="px-2 py-1 bg-kumo-warning-tint rounded-full">
                  <Text className="text-xs font-sans-semibold text-kumo-warning">
                    {outboxPending} pending
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              className={`h-12 rounded-md items-center justify-center flex-row gap-2 ${
                isSyncing ? "bg-kumo-fill" : "bg-kumo-brand"
              }`}
              onPress={handleSyncNow}
              disabled={isSyncing || !isOnline}
            >
              <RefreshCw
                size={18}
                color="#FFFFFF"
                strokeWidth={2.5}
                className={isSyncing ? "animate-spin" : ""}
              />
              <Text className="text-base font-sans-semibold text-kumo-inverse">
                {isSyncing ? "Syncing..." : "Sync Sekarang"}
              </Text>
            </Pressable>

            {outboxPending > 0 && (
              <Pressable
                className="h-12 rounded-md items-center justify-center flex-row gap-2 mt-3 border border-kumo-danger"
                onPress={handlePurgeOutbox}
              >
                <Trash2 size={18} color="#EF4444" strokeWidth={2.5} />
                <Text className="text-base font-sans-semibold text-kumo-danger">
                  Bersihkan Outbox ({outboxPending})
                </Text>
              </Pressable>
            )}
          </View>

          <View className="bg-kumo-base border border-kumo-hairline rounded-lg px-4">
            <SettingItem
              icon={<Cloud size={20} color={Colors.primary.DEFAULT} strokeWidth={2} />}
              iconBg="bg-kumo-info-tint"
              title="Auto-Sync"
              subtitle="Sinkronisasi otomatis ke cloud"
              value={autoSync}
              onToggle={toggleAutoSync}
            />
            <SettingItem
              icon={<Wifi size={20} color={Colors.accent.DEFAULT} strokeWidth={2} />}
              iconBg="bg-kumo-warning-tint"
              title="Mode Offline"
              subtitle="Kerja tanpa koneksi internet"
              value={offlineMode}
              onToggle={toggleOfflineMode}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-3">
            Notifikasi
          </Text>
          <View className="bg-kumo-base border border-kumo-hairline rounded-lg px-4">
            <SettingItem
              icon={<Bell size={20} color={Colors.primary.DEFAULT} strokeWidth={2} />}
              iconBg="bg-kumo-info-tint"
              title="Push Notifikasi"
              subtitle="Terima notifikasi transaksi"
              value={notifications}
              onToggle={setNotifications}
            />
            <SettingItem
              icon={<Smartphone size={20} color={Colors.accent.DEFAULT} strokeWidth={2} />}
              iconBg="bg-kumo-warning-tint"
              title="Stok Rendah"
              subtitle="Peringatan stok hampir habis"
              value={true}
              onToggle={() => {}}
            />
          </View>
        </View>

        {/* Keuangan Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-3">
            Keuangan
          </Text>
          <View className="bg-kumo-base border border-kumo-hairline rounded-lg px-4">
            <SettingItem
              icon={<DollarSign size={20} color={Colors.secondary.DEFAULT} strokeWidth={2} />}
              iconBg="bg-kumo-success-tint"
              title="Sistem Upah"
              subtitle="Hitung gaji karyawan berdasarkan jam kerja"
              value={payrollEnabled}
              onToggle={togglePayroll}
            />
          </View>
        </View>

        {/* Security Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-3">
            Keamanan
          </Text>
          <View className="bg-kumo-base border border-kumo-hairline rounded-lg px-4">
            <SettingItem
              icon={<Shield size={20} color={Colors.secondary.DEFAULT} strokeWidth={2} />}
              iconBg="bg-kumo-success-tint"
              title="Ubah Password"
              subtitle="Perbarui kata sandi akun"
              onPress={() => {}}
              showArrow
            />
          </View>
        </View>

        {/* App Info */}
        <View className="px-6">
          <View className="bg-kumo-base border border-kumo-hairline rounded-lg p-4 items-center mb-6">
            <Text className="text-2xl font-sans-semibold text-kumo-default">
              KasirKasiran
            </Text>
            <Text className="text-sm font-sans text-kumo-subtle mt-1">Versi 1.0.0</Text>
            <Text className="text-xs font-sans text-kumo-subtle mt-2 text-center">
              © 2026 KasirKasiran. All rights reserved.
            </Text>
          </View>

          <Pressable
            className="h-14 rounded-md items-center justify-center border border-kumo-danger flex-row mb-8"
            onPress={handleLogout}
          >
            <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
            <Text className="ml-2 text-base font-sans-semibold text-kumo-danger">
              Keluar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
