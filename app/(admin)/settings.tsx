import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Switch, Alert } from "react-native";
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
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { syncAll, startAutoSync, stopAutoSync } from "@/services/sync";
import { useAuth } from "@/hooks/useAuth";

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
      className="flex-row items-center py-4 border-b-2 border-muted"
      onPress={onPress}
    >
      <View className={`w-12 h-12 rounded-lg items-center justify-center ${iconBg}`}>
        {icon}
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-base font-sans-bold text-foreground">{title}</Text>
        <Text className="text-xs font-sans text-gray-500 mt-0.5">{subtitle}</Text>
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

  const toggleAutoSync = useCallback(
    (value: boolean) => {
      setAutoSync(value);
      if (value) {
        startAutoSync();
      } else {
        stopAutoSync();
      }
    },
    []
  );

  const handleSyncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncAll();
      Alert.alert("Sukses", "Sinkronisasi selesai");
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
            Konfigurasi
          </Text>
          <Text
            className="text-2xl font-sans-extrabold text-foreground mt-1"
            style={{ letterSpacing: -0.5 }}
          >
            Pengaturan
          </Text>
        </View>

        {/* Printer Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Printer
          </Text>
          <View className="bg-muted rounded-lg p-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                  <Printer size={22} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
                </View>
                <View className="ml-4">
                  <Text className="text-base font-sans-bold text-foreground">
                    Printer Thermal
                  </Text>
                  <Text className="text-xs font-sans text-gray-500">
                    Bluetooth · Terhubung
                  </Text>
                </View>
              </View>
              <View className="px-3 py-1 bg-secondary-100 rounded-full">
                <Text className="text-xs font-sans-bold text-secondary">Aktif</Text>
              </View>
            </View>
            <Pressable className="h-12 rounded-md bg-primary items-center justify-center">
              <Text className="text-base font-sans-bold text-white">Test Print</Text>
            </Pressable>
          </View>
        </View>

        {/* Sync Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Sinkronisasi
          </Text>

          <View className="bg-muted rounded-lg p-4 mb-3">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                  {isOnline ? (
                    <Cloud size={20} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
                  ) : (
                    <CloudOff size={20} color={Colors.gray[400]} strokeWidth={2.5} />
                  )}
                </View>
                <View className="ml-3">
                  <Text className="text-sm font-sans-bold text-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </Text>
                  <Text className="text-xs font-sans text-gray-500">
                    Sync terakhir: {lastSyncFormatted}
                  </Text>
                </View>
              </View>
              {outboxPending > 0 && (
                <View className="px-2 py-1 bg-accent-100 rounded-full">
                  <Text className="text-xs font-sans-bold text-accent-600">
                    {outboxPending} pending
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              className={`h-12 rounded-md items-center justify-center flex-row gap-2 ${
                isSyncing ? "bg-gray-300" : "bg-primary"
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
              <Text className="text-base font-sans-bold text-white">
                {isSyncing ? "Syncing..." : "Sync Sekarang"}
              </Text>
            </Pressable>
          </View>

          <View className="bg-muted rounded-lg px-4">
            <SettingItem
              icon={<Cloud size={20} color={Colors.primary.DEFAULT} strokeWidth={2} />}
              iconBg="bg-primary-100"
              title="Auto-Sync"
              subtitle="Sinkronisasi otomatis ke cloud"
              value={autoSync}
              onToggle={toggleAutoSync}
            />
            <SettingItem
              icon={<Wifi size={20} color={Colors.accent.DEFAULT} strokeWidth={2} />}
              iconBg="bg-accent-100"
              title="Mode Offline"
              subtitle="Kerja tanpa koneksi internet"
              value={offlineMode}
              onToggle={setOfflineMode}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Notifikasi
          </Text>
          <View className="bg-muted rounded-lg px-4">
            <SettingItem
              icon={<Bell size={20} color={Colors.primary.DEFAULT} strokeWidth={2} />}
              iconBg="bg-primary-100"
              title="Push Notifikasi"
              subtitle="Terima notifikasi transaksi"
              value={notifications}
              onToggle={setNotifications}
            />
            <SettingItem
              icon={<Smartphone size={20} color={Colors.accent.DEFAULT} strokeWidth={2} />}
              iconBg="bg-accent-100"
              title="Stok Rendah"
              subtitle="Peringatan stok hampir habis"
              value={true}
              onToggle={() => {}}
            />
          </View>
        </View>

        {/* Security Section */}
        <View className="px-6 mb-6">
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
            Keamanan
          </Text>
          <View className="bg-muted rounded-lg px-4">
            <SettingItem
              icon={<Shield size={20} color={Colors.secondary.DEFAULT} strokeWidth={2} />}
              iconBg="bg-secondary-100"
              title="Ubah Password"
              subtitle="Perbarui kata sandi akun"
              onPress={() => {}}
              showArrow
            />
          </View>
        </View>

        {/* App Info */}
        <View className="px-6">
          <View className="bg-muted rounded-lg p-4 items-center mb-6">
            <Text className="text-2xl font-sans-extrabold text-foreground">
              KasirPuintar
            </Text>
            <Text className="text-sm font-sans text-gray-500 mt-1">Versi 1.0.0</Text>
            <Text className="text-xs font-sans text-gray-400 mt-2 text-center">
              © 2026 KasirPuintar. All rights reserved.
            </Text>
          </View>

          <Pressable
            className="h-14 rounded-md items-center justify-center border-4 border-red-500 flex-row mb-8"
            onPress={handleLogout}
          >
            <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
            <Text className="ml-2 text-base font-sans-bold text-red-500">
              Keluar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}