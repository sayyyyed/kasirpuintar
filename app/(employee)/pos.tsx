import React, { useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  X,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useCart } from "@/hooks/useCart";

const CATEGORIES: string[] = ["Semua"];
const PRODUCTS: any[] = [];

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function POSScreen() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Semua");
  const [showCart, setShowCart] = useState(false);
  const { items: cart, addItem, updateQty, removeItem, total, count } = useCart();

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p: any) => {
      const s = p.name?.toLowerCase().includes(search.toLowerCase());
      const c = activeCat === "Semua" || p.category === activeCat;
      return s && c;
    });
  }, [search, activeCat]);

  const renderProduct = useCallback(
    ({ item }: { item: any }) => (
      <Pressable
        className="flex-1 bg-muted rounded-lg p-4 m-1.5"
        onPress={() => addItem(item)}
      >
        <View className="w-full aspect-square rounded-md bg-gray-200 items-center justify-center mb-3">
          <Text className="text-2xl">📦</Text>
        </View>
        <Text className="text-sm font-sans-bold text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs font-sans text-gray-500 mt-0.5">
          Stok: {item.stock || 0}
        </Text>
        <Text className="text-base font-sans-bold text-primary mt-1">
          {fmt(item.price || 0)}
        </Text>
      </Pressable>
    ),
    [addItem]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {!showCart ? (
        <View className="flex-1">
          <View className="px-4 pt-4 pb-2">
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
          <View className="px-4 pb-3 flex-row gap-2">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                className={`px-4 py-2 rounded-md ${
                  activeCat === cat ? "bg-primary" : "bg-muted"
                }`}
                onPress={() => setActiveCat(cat)}
              >
                <Text
                  className={`text-sm font-sans-semibold ${
                    activeCat === cat ? "text-white" : "text-gray-600"
                  }`}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          {PRODUCTS.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-lg font-sans-medium text-gray-400">
                Belum ada produk
              </Text>
              <Text className="text-sm font-sans text-gray-400 mt-1">
                Produk akan muncul setelah ditambahkan pemilik
              </Text>
            </View>
          ) : (
            <FlashList
              data={filtered}
              numColumns={3}
              estimatedItemSize={200}
              renderItem={renderProduct}
              contentContainerStyle={{ padding: 4 }}
            />
          )}

          {count > 0 && (
            <Pressable
              className="absolute bottom-4 left-4 right-4 bg-primary rounded-lg px-5 py-4 flex-row items-center justify-between"
              onPress={() => setShowCart(true)}
            >
              <Text className="text-white font-sans-bold text-base">
                {count} item
              </Text>
              <Text className="text-white font-sans-extrabold text-lg">
                {fmt(total)}
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-3 bg-muted">
            <Text className="text-sm font-sans-bold text-foreground uppercase tracking-wider">
              Keranjang ({count})
            </Text>
            <Pressable onPress={() => setShowCart(false)}>
              <X size={22} color={Colors.gray[600]} />
            </Pressable>
          </View>
          {cart.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-400 font-sans">Keranjang kosong</Text>
            </View>
          ) : (
            <FlashList
              data={cart}
              estimatedItemSize={72}
              renderItem={({ item }) => (
                <View className="flex-row items-center px-4 py-3 border-b-2 border-muted">
                  <View className="flex-1">
                    <Text className="text-sm font-sans-bold text-foreground">
                      {item.name}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500">
                      {fmt(item.price)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      className="w-8 h-8 rounded-md bg-muted items-center justify-center"
                      onPress={() => updateQty(item.productId, -1)}
                    >
                      <Minus size={14} color={Colors.gray[600]} strokeWidth={2.5} />
                    </Pressable>
                    <Text className="text-sm font-sans-bold w-6 text-center">
                      {item.qty}
                    </Text>
                    <Pressable
                      className="w-8 h-8 rounded-md bg-primary items-center justify-center"
                      onPress={() => updateQty(item.productId, 1)}
                    >
                      <Plus size={14} color="#FFF" strokeWidth={2.5} />
                    </Pressable>
                    <Pressable
                      className="w-8 h-8 rounded-md bg-red-100 items-center justify-center ml-1"
                      onPress={() => removeItem(item.productId)}
                    >
                      <Trash2 size={14} color="#EF4444" strokeWidth={2} />
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
          <View className="p-4 bg-muted">
            <View className="flex-row justify-between mb-3">
              <Text className="text-sm font-sans-medium text-gray-500 uppercase tracking-wider">
                Total
              </Text>
              <Text
                className="text-2xl font-sans-extrabold text-foreground"
                style={{ letterSpacing: -0.5 }}
              >
                {fmt(total)}
              </Text>
            </View>
            <Pressable
              className={`h-16 rounded-md items-center justify-center flex-row ${
                cart.length > 0 ? "bg-secondary" : "bg-gray-300"
              }`}
              disabled={cart.length === 0}
            >
              <CreditCard size={22} color="#FFF" strokeWidth={2.5} />
              <Text className="ml-3 text-lg font-sans-bold text-white">
                Proses Pembayaran
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
