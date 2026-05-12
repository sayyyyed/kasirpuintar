import React, { useState, useMemo } from "react";
import { View, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Search, Package, AlertTriangle } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

const INVENTORY = [
  { id: "1", name: "Nasi Goreng", stock: 50, unit: "porsi", category: "Makanan", minStock: 10 },
  { id: "2", name: "Mie Ayam", stock: 8, unit: "porsi", category: "Makanan", minStock: 10 },
  { id: "3", name: "Es Teh Manis", stock: 100, unit: "gelas", category: "Minuman", minStock: 20 },
  { id: "4", name: "Kopi Susu", stock: 80, unit: "gelas", category: "Minuman", minStock: 15 },
  { id: "5", name: "Ayam Geprek", stock: 5, unit: "porsi", category: "Makanan", minStock: 10 },
  { id: "6", name: "Jus Jeruk", stock: 60, unit: "gelas", category: "Minuman", minStock: 15 },
  { id: "7", name: "Kerupuk", stock: 200, unit: "pcs", category: "Snack", minStock: 50 },
  { id: "8", name: "Gorengan", stock: 3, unit: "pcs", category: "Snack", minStock: 20 },
  { id: "9", name: "Air Mineral", stock: 300, unit: "botol", category: "Minuman", minStock: 50 },
  { id: "10", name: "Soto Ayam", stock: 40, unit: "porsi", category: "Makanan", minStock: 10 },
];

export default function InventoryScreen() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return INVENTORY;
    return INVENTORY.filter((i) =>
      i.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const lowStockCount = useMemo(
    () => INVENTORY.filter((i) => i.stock <= i.minStock).length,
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-sans-extrabold text-foreground" style={{ letterSpacing: -0.5 }}>
          Stok Barang
        </Text>
        <Text className="text-sm font-sans text-gray-500 mt-1">
          Tampilan baca-saja
        </Text>
      </View>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <View className="mx-6 mb-4 bg-accent-50 rounded-lg p-4 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-accent-100 items-center justify-center">
            <AlertTriangle size={18} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-sans-bold text-foreground">
              {lowStockCount} item stok rendah
            </Text>
            <Text className="text-xs font-sans text-gray-500">
              Perlu restok segera
            </Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View className="px-6 pb-3">
        <View className="flex-row items-center bg-muted rounded-md px-4">
          <Search size={18} color={Colors.gray[400]} strokeWidth={2} />
          <TextInput
            className="flex-1 h-12 ml-3 text-base text-foreground font-sans"
            placeholder="Cari barang..."
            placeholderTextColor={Colors.gray[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Inventory List */}
      <FlashList
        data={filtered}
        estimatedItemSize={80}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        renderItem={({ item }) => {
          const isLow = item.stock <= item.minStock;
          return (
            <View className={`flex-row items-center py-4 border-b-2 border-muted`}>
              <View className={`w-12 h-12 rounded-lg items-center justify-center ${isLow ? "bg-red-100" : "bg-primary-50"}`}>
                <Package size={20} color={isLow ? "#EF4444" : Colors.primary.DEFAULT} strokeWidth={2} />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base font-sans-bold text-foreground">{item.name}</Text>
                <Text className="text-xs font-sans text-gray-500">{item.category} · Min: {item.minStock}</Text>
              </View>
              <View className="items-end">
                <Text className={`text-lg font-sans-extrabold ${isLow ? "text-red-500" : "text-foreground"}`}>
                  {item.stock}
                </Text>
                <Text className="text-xs font-sans text-gray-400">{item.unit}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
