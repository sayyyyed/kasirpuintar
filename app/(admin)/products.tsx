import React, { useState, useMemo } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Search, Plus, Package, TrendingUp, DollarSign } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

const PRODUCTS = [
  { id: "1", name: "Nasi Goreng", price: 15000, cogs: 8000, stock: 50, category: "Makanan", sold: 132 },
  { id: "2", name: "Mie Ayam", price: 12000, cogs: 6500, stock: 8, category: "Makanan", sold: 89 },
  { id: "3", name: "Es Teh Manis", price: 5000, cogs: 2000, stock: 100, category: "Minuman", sold: 87 },
  { id: "4", name: "Kopi Susu", price: 10000, cogs: 4500, stock: 80, category: "Minuman", sold: 98 },
  { id: "5", name: "Ayam Geprek", price: 18000, cogs: 10000, stock: 5, category: "Makanan", sold: 145 },
  { id: "6", name: "Jus Jeruk", price: 8000, cogs: 3500, stock: 60, category: "Minuman", sold: 56 },
  { id: "7", name: "Kerupuk", price: 3000, cogs: 1200, stock: 200, category: "Snack", sold: 45 },
  { id: "8", name: "Gorengan", price: 2000, cogs: 800, stock: 3, category: "Snack", sold: 78 },
  { id: "9", name: "Air Mineral", price: 4000, cogs: 1500, stock: 300, category: "Minuman", sold: 67 },
  { id: "10", name: "Soto Ayam", price: 13000, cogs: 7000, stock: 40, category: "Makanan", sold: 54 },
];

const CATEGORIES = ["Semua", "Makanan", "Minuman", "Snack"];

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Semua");

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const s = p.name.toLowerCase().includes(search.toLowerCase());
      const c = activeCat === "Semua" || p.category === activeCat;
      return s && c;
    });
  }, [search, activeCat]);

  const totalProducts = PRODUCTS.length;
  const lowStockCount = PRODUCTS.filter((p) => p.stock <= 10).length;
  const totalValue = PRODUCTS.reduce((s, p) => s + p.price * p.stock, 0);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-end justify-between">
        <View>
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
            Inventori
          </Text>
          <Text className="text-2xl font-sans-extrabold text-foreground mt-1" style={{ letterSpacing: -0.5 }}>
            Produk
          </Text>
        </View>
        <Pressable className="bg-primary rounded-md px-4 py-3 flex-row items-center">
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-sm font-sans-bold text-white ml-2">Tambah</Text>
        </Pressable>
      </View>

      {/* Summary Cards */}
      <View className="px-6 py-4 flex-row gap-3">
        <View className="flex-1 bg-primary-50 rounded-lg p-4">
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mb-2">
            <Package size={18} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
          </View>
          <Text className="text-xl font-sans-extrabold text-foreground">{totalProducts}</Text>
          <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">Produk</Text>
        </View>
        <View className="flex-1 bg-accent-50 rounded-lg p-4">
          <View className="w-10 h-10 rounded-full bg-accent-100 items-center justify-center mb-2">
            <TrendingUp size={18} color={Colors.accent.DEFAULT} strokeWidth={2.5} />
          </View>
          <Text className="text-xl font-sans-extrabold text-red-500">{lowStockCount}</Text>
          <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">Stok Rendah</Text>
        </View>
        <View className="flex-1 bg-secondary-50 rounded-lg p-4">
          <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center mb-2">
            <DollarSign size={18} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
          </View>
          <Text className="text-sm font-sans-extrabold text-foreground" numberOfLines={1}>
            {(totalValue / 1000000).toFixed(1)}M
          </Text>
          <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">Nilai Stok</Text>
        </View>
      </View>

      {/* Search */}
      <View className="px-6 pb-2">
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

      {/* Category tabs */}
      <View className="px-6 pb-3 flex-row gap-2">
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            className={`px-4 py-2 rounded-md ${activeCat === cat ? "bg-primary" : "bg-muted"}`}
            onPress={() => setActiveCat(cat)}
          >
            <Text className={`text-sm font-sans-semibold ${activeCat === cat ? "text-white" : "text-gray-600"}`}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Product List */}
      <FlashList
        data={filtered}
        estimatedItemSize={88}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        renderItem={({ item }) => {
          const isLow = item.stock <= 10;
          const margin = item.price - item.cogs;
          const marginPct = Math.round((margin / item.price) * 100);
          return (
            <View className="flex-row items-center py-4 border-b-2 border-muted">
              {/* Product Image Placeholder */}
              <View className={`w-14 h-14 rounded-lg items-center justify-center ${isLow ? "bg-red-100" : "bg-muted"}`}>
                <Text className="text-xl">🍽️</Text>
              </View>

              {/* Info */}
              <View className="ml-4 flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-sans-bold text-foreground">{item.name}</Text>
                  {isLow && (
                    <View className="bg-red-100 px-2 py-0.5 rounded">
                      <Text className="text-xs font-sans-bold text-red-500">Low</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs font-sans text-gray-500 mt-0.5">
                  {item.category} · Terjual {item.sold}
                </Text>
                <View className="flex-row items-center mt-1 gap-3">
                  <Text className="text-xs font-sans-medium text-primary">
                    {fmt(item.price)}
                  </Text>
                  <Text className="text-xs font-sans text-gray-400">
                    COGS: {fmt(item.cogs)}
                  </Text>
                  <Text className="text-xs font-sans-semibold text-secondary">
                    +{marginPct}%
                  </Text>
                </View>
              </View>

              {/* Stock */}
              <View className="items-end">
                <Text className={`text-lg font-sans-extrabold ${isLow ? "text-red-500" : "text-foreground"}`}>
                  {item.stock}
                </Text>
                <Text className="text-xs font-sans text-gray-400">unit</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}