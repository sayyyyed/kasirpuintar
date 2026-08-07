import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Search, Package, AlertTriangle } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

export default function InventoryScreen() {
  const [search, setSearch] = useState("");
  const [inventory] = useState<any[]>([]);

  const filtered = useMemo(() => {
    if (!search) return inventory;
    return inventory.filter((i: any) =>
      i.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, inventory]);

  const lowStockCount = inventory.filter(
    (i: any) => (i.stock || 0) <= (i.min_stock || 10)
  ).length;

  if (inventory.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 pt-6 pb-4">
          <Text
            className="text-2xl font-sans-extrabold text-foreground"
            style={{ letterSpacing: -0.5 }}
          >
            Stok
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Package size={48} color={Colors.gray[300]} strokeWidth={1.5} />
          <Text className="text-base font-sans-medium text-gray-400 mt-4">
            Belum ada data produk
          </Text>
          <Text className="text-sm font-sans text-gray-400 mt-1">
            Produk akan muncul setelah ditambahkan pemilik
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-4">
        <Text
          className="text-2xl font-sans-extrabold text-foreground"
          style={{ letterSpacing: -0.5 }}
        >
          Stok
        </Text>
        {lowStockCount > 0 && (
          <View className="flex-row items-center mt-3 bg-accent-50 rounded-lg px-4 py-3">
            <AlertTriangle size={18} color={Colors.accent.DEFAULT} strokeWidth={2} />
            <Text className="ml-2 text-sm font-sans-semibold text-accent-600">
              {lowStockCount} produk stok rendah
            </Text>
          </View>
        )}
      </View>

      <View className="px-6 pb-4">
        <View className="flex-row items-center bg-muted rounded-md px-4">
          <Search size={18} color={Colors.gray[400]} strokeWidth={2} />
          <TextInput
            className="flex-1 h-12 ml-3 text-base text-foreground font-sans"
            placeholder="Cari produk..."
            placeholderTextColor={Colors.gray[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlashList
        data={filtered}
        estimatedItemSize={72}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        renderItem={({ item }: { item: any }) => {
          const isLow = (item.stock || 0) <= (item.min_stock || 10);
          return (
            <View className="flex-row items-center py-4 border-b-2 border-muted">
              <View className="flex-1">
                <Text className="text-base font-sans-bold text-foreground">
                  {item.name}
                </Text>
                <Text className="text-xs font-sans text-gray-500 mt-0.5">
                  {item.category_name || item.category_id}
                </Text>
              </View>
              <View className="items-end">
                <Text
                  className={`text-lg font-sans-extrabold ${
                    isLow ? "text-red-500" : "text-foreground"
                  }`}
                >
                  {item.stock || 0}
                </Text>
                <Text className="text-xs font-sans text-gray-400">{item.unit || "pcs"}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
