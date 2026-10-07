import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Printer, Search, SlidersHorizontal, Users } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { getAppSettings, saveAppSettings, type AppSettings } from "@/services/appSettings";
import {
  getPrinterSettings,
  printReceipt,
  savePrinterSettings,
  testPrint,
  type PaperWidth,
  type PrinterSettings,
} from "@/services/printer";

const SAMPLE_RECEIPT = {
  employeeName: "Kasir Demo",
  transactionId: "TRX-123456",
  createdAt: Date.now(),
  items: [
    { name: "Contoh Produk", qty: 2, price: 10000 },
    { name: "Minuman", qty: 1, price: 5000 },
  ],
  total: 25000,
  paymentMethod: "cash",
  paid: 30000,
  change: 5000,
};

export default function PrinterSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrinterSettings | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.role !== "owner") router.replace("/(employee)/pos");
  }, [router, user]);

  useEffect(() => {
    Promise.all([getPrinterSettings(), getAppSettings()]).then(([printer, app]) => {
      setSettings(printer);
      setAppSettings(app);
    });
  }, []);

  if (!settings || !appSettings) return null;

  const update = (next: Partial<PrinterSettings>) => {
    setSettings((current) => (current ? { ...current, ...next } : current));
  };

  const persist = async () => {
    setSaving(true);
    await savePrinterSettings(settings);
    setSaving(false);
  };

  const findPrinter = async () => {
    setSearching(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const printer = {
      printerName: "Printer Sistem Android",
      printerConnected: true,
    };
    setSearching(false);
    update(printer);
    await savePrinterSettings({ ...settings, ...printer });
    Alert.alert(
      "Printer ditemukan",
      "Printer sistem Android siap digunakan. Untuk printer Bluetooth thermal, pastikan perangkat sudah dipasangkan di pengaturan Bluetooth Android."
    );
  };

  const sendTestPrint = async () => {
    await persist();
    try {
      await testPrint();
    } catch (error: any) {
      Alert.alert("Test print gagal", error?.message || "Printer belum tersedia.");
    }
  };

  const sendPreviewPrint = async () => {
    await persist();
    try {
      await printReceipt(SAMPLE_RECEIPT);
    } catch (error: any) {
      Alert.alert("Print gagal", error?.message || "Tidak dapat membuka printer.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-kumo-base">
      <View className="px-5 py-4 flex-row items-center border-b border-kumo-line">
        <Pressable onPress={() => router.back()} className="w-11 h-11 rounded-md bg-kumo-fill items-center justify-center">
          <ArrowLeft size={22} color={Colors.gray[700]} />
        </Pressable>
        <View className="ml-3">
          <Text className="text-xs font-sans-semibold text-kumo-subtle  ">Konfigurasi</Text>
          <Text className="text-xl font-sans-semibold text-kumo-default">Printer Struk</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10">
        <View className="bg-kumo-brand rounded-xl p-5 mt-5">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-kumo-inverse/20 items-center justify-center">
              <Printer size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-lg font-sans-semibold text-kumo-inverse">Printer kasir</Text>
              <Text className="text-xs font-sans text-kumo-inverse opacity-80 mt-1">
                {settings.printerName || "Belum ada printer yang dipilih"}
              </Text>
            </View>
            <View className="px-2 py-1 rounded-full bg-kumo-inverse/20">
              <Text className="text-xs font-sans-semibold text-kumo-inverse">
                {settings.printerConnected ? "Terhubung" : "Belum terhubung"}
              </Text>
            </View>
          </View>
          <Pressable className="h-12 rounded-md bg-kumo-base items-center justify-center flex-row mt-5" onPress={findPrinter} disabled={searching}>
            <Search size={18} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
            <Text className="ml-2 text-sm font-sans-semibold text-kumo-brand">
              {searching ? "Mencari printer..." : "Cari Printer"}
            </Text>
          </Pressable>
        </View>

        <View className="mt-7">
          <Text className="text-sm font-sans-semibold text-kumo-subtle mb-3">Identitas Toko</Text>
          <View className="bg-kumo-base border border-kumo-hairline rounded-lg p-4">
            <Text className="text-sm font-sans-semibold text-kumo-default mb-2">Nama toko</Text>
            <TextInput
              className="bg-kumo-control border border-kumo-line rounded-lg px-3 h-12 text-base text-kumo-default font-sans"
              value={appSettings.storeName}
              onChangeText={(storeName) => setAppSettings({ ...appSettings, storeName })}
              onBlur={() => saveAppSettings(appSettings)}
              placeholder="Nama toko"
            />
          </View>
        </View>

        <View className="mt-7">
          <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-3">Ukuran Kertas</Text>
          <View className="flex-row gap-3">
            {[58, 80].map((width) => {
              const active = settings.paperWidth === width;
              return (
                <Pressable
                  key={width}
                  className={`flex-1 rounded-lg p-4 border ${active ? "border-kumo-brand bg-kumo-info-tint" : "border-kumo-line bg-kumo-base"}`}
                  onPress={() => update({ paperWidth: width as PaperWidth })}
                >
                  <Text className={`text-lg font-sans-semibold ${active ? "text-kumo-brand" : "text-kumo-default"}`}>{width} mm</Text>
                  <Text className="text-xs font-sans text-kumo-subtle mt-1">Thermal receipt</Text>
                  {active && <Check size={18} color={Colors.primary.DEFAULT} style={{ position: "absolute", right: 12, top: 12 }} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-7">
          <View className="flex-row items-center mb-3">
            <SlidersHorizontal size={17} color={Colors.gray[600]} />
            <Text className="text-sm font-sans-semibold text-kumo-subtle   ml-2">Layout & Isi Struk</Text>
          </View>
          <View className="bg-kumo-fill rounded-lg px-4">
            {[{ key: "showStoreName", label: "Nama toko" }, { key: "showDate", label: "Tanggal dan waktu" }, { key: "showPayment", label: "Detail pembayaran" }].map((item) => (
              <View key={item.key} className="flex-row items-center justify-between py-4 border-b border-kumo-inverse">
                <Text className="text-base font-sans-semibold text-kumo-default">{item.label}</Text>
                <Switch
                  value={settings[item.key as keyof PrinterSettings] as boolean}
                  onValueChange={(value) => update({ [item.key]: value })}
                  trackColor={{ false: Colors.gray[300], true: Colors.primary.DEFAULT }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
            <View className="flex-row items-center justify-between py-4 border-b border-kumo-inverse">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-9 h-9 rounded-lg bg-kumo-info-tint items-center justify-center mr-3">
                  <Users size={18} color={Colors.primary.DEFAULT} strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-sans-semibold text-kumo-default">
                    Nama karyawan di struk
                  </Text>
                  <Text className="text-xs font-sans text-kumo-subtle mt-0.5">
                    Tampilkan nama kasir yang memproses transaksi
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.showCashierName}
                onValueChange={(showCashierName) => {
                  const next = { ...settings, showCashierName };
                  setSettings(next);
                  savePrinterSettings(next);
                }}
                trackColor={{ false: Colors.gray[300], true: Colors.primary.DEFAULT }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View className="py-4">
              <Text className="text-sm font-sans-semibold text-kumo-default mb-2">Teks penutup</Text>
              <TextInput
                className="bg-kumo-base rounded-md px-3 h-12 text-base text-kumo-default font-sans"
                value={settings.footerText}
                onChangeText={(value) => update({ footerText: value })}
                placeholder="Terima kasih"
              />
            </View>
          </View>
        </View>

        <View className="mt-7">
          <Text className="text-sm font-sans-semibold text-kumo-subtle   mb-3">Preview Struk</Text>
          <View className="bg-kumo-tint rounded-lg p-4 items-center">
            <View className="bg-kumo-base p-4 shadow-kumo" style={{ width: settings.paperWidth === 58 ? 220 : 290 }}>
              {settings.showStoreName && <Text className="text-center font-sans-semibold text-kumo-default">{appSettings.storeName}</Text>}
              {settings.showCashierName && <Text className="text-center text-[10px] text-kumo-subtle mt-1">Kasir: {SAMPLE_RECEIPT.employeeName}</Text>}
              {settings.showDate && <Text className="text-center text-[10px] text-kumo-subtle mt-1">06/10/2026 12.00</Text>}
              <View className="border-t border-dashed border-kumo-line my-2" />
              <Text className="text-xs text-kumo-default">Contoh Produk</Text>
              <View className="flex-row justify-between"><Text className="text-[10px] text-kumo-subtle">2 x Rp 10.000</Text><Text className="text-[10px] text-kumo-default">Rp 20.000</Text></View>
              <Text className="text-xs text-kumo-default mt-2">Minuman</Text>
              <View className="flex-row justify-between"><Text className="text-[10px] text-kumo-subtle">1 x Rp 5.000</Text><Text className="text-[10px] text-kumo-default">Rp 5.000</Text></View>
              <View className="border-t border-dashed border-kumo-line my-2" />
              <View className="flex-row justify-between"><Text className="text-xs font-sans-semibold">TOTAL</Text><Text className="text-xs font-sans-semibold">Rp 25.000</Text></View>
              {settings.showPayment && <Text className="text-[10px] text-kumo-subtle mt-1">Tunai · Rp 30.000</Text>}
              <Text className="text-center text-[10px] text-kumo-subtle mt-3">{settings.footerText || " "}</Text>
            </View>
          </View>
        </View>

        <Text className="text-xs font-sans text-kumo-subtle mt-5">
          Preview ini menjadi acuan susunan struk yang dikirim ke printer. Pengaturan Legal dari Android Print Spooler tidak digunakan sebagai ukuran desain struk.
        </Text>
        <Pressable className={`h-14 rounded-md items-center justify-center mt-5 ${saving ? "bg-kumo-fill" : "bg-kumo-brand"}`} onPress={persist} disabled={saving}>
          <Text className="text-base font-sans-semibold text-kumo-inverse">{saving ? "Menyimpan..." : "Simpan Pengaturan"}</Text>
        </Pressable>
        <Pressable className="h-14 rounded-md items-center justify-center mt-3 border border-kumo-success" onPress={sendTestPrint}>
          <Text className="text-base font-sans-semibold text-kumo-success">Test Print</Text>
        </Pressable>
        <Pressable className="h-14 rounded-md items-center justify-center mt-3 border border-kumo-brand" onPress={sendPreviewPrint}>
          <Text className="text-base font-sans-semibold text-kumo-brand">Cetak Preview</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
