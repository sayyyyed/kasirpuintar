import React, { useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Search, Plus, Minus, Trash2, CreditCard, X } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

const CATEGORIES = ["Semua", "Makanan", "Minuman", "Snack"];
const PRODUCTS = [
  { id: "1", name: "Nasi Goreng", price: 15000, category: "Makanan", stock: 50 },
  { id: "2", name: "Mie Ayam", price: 12000, category: "Makanan", stock: 30 },
  { id: "3", name: "Es Teh Manis", price: 5000, category: "Minuman", stock: 100 },
  { id: "4", name: "Kopi Susu", price: 10000, category: "Minuman", stock: 80 },
  { id: "5", name: "Ayam Geprek", price: 18000, category: "Makanan", stock: 25 },
  { id: "6", name: "Jus Jeruk", price: 8000, category: "Minuman", stock: 60 },
  { id: "7", name: "Kerupuk", price: 3000, category: "Snack", stock: 200 },
  { id: "8", name: "Gorengan", price: 2000, category: "Snack", stock: 150 },
  { id: "9", name: "Air Mineral", price: 4000, category: "Minuman", stock: 300 },
  { id: "10", name: "Soto Ayam", price: 13000, category: "Makanan", stock: 40 },
  { id: "11", name: "Bakso", price: 14000, category: "Makanan", stock: 35 },
  { id: "12", name: "Teh Botol", price: 5000, category: "Minuman", stock: 90 },
];

type CartItem = { id: string; name: string; price: number; qty: number };
const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function POSScreen() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Semua");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const s = p.name.toLowerCase().includes(search.toLowerCase());
      const c = activeCat === "Semua" || p.category === activeCat;
      return s && c;
    });
  }, [search, activeCat]);

  const addToCart = useCallback((p: (typeof PRODUCTS)[0]) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((id: string, d: number) => {
    setCart((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i)).filter((i) => i.qty > 0));
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const renderProduct = useCallback(({ item }: { item: (typeof PRODUCTS)[0] }) => (
    <Pressable className="flex-1 bg-muted rounded-lg p-4 m-1.5" onPress={() => addToCart(item)}>
      <View className="w-full aspect-square rounded-md bg-gray-200 items-center justify-center mb-3">
        <Text className="text-2xl">🍽️</Text>
      </View>
      <Text className="text-sm font-sans-bold text-foreground" numberOfLines={1}>{item.name}</Text>
      <Text className="text-xs font-sans text-gray-500 mt-0.5">Stok: {item.stock}</Text>
      <Text className="text-base font-sans-bold text-primary mt-1">{fmt(item.price)}</Text>
    </Pressable>
  ), [addToCart]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Main: product grid */}
      {!showCart ? (
        <View className="flex-1">
          {/* Search */}
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
          {/* Category tabs */}
          <View className="px-4 pb-3 flex-row gap-2">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                className={`px-4 py-2 rounded-md ${activeCat === cat ? "bg-primary" : "bg-muted"}`}
                onPress={() => setActiveCat(cat)}
              >
                <Text className={`text-sm font-sans-semibold ${activeCat === cat ? "text-white" : "text-gray-600"}`}>{cat}</Text>
              </Pressable>
            ))}
          </View>
          {/* Grid */}
          <FlashList data={filtered} numColumns={3} estimatedItemSize={200} renderItem={renderProduct} contentContainerStyle={{ padding: 4 }} />
          {/* Cart FAB */}
          {count > 0 && (
            <Pressable className="absolute bottom-4 left-4 right-4 bg-primary rounded-lg px-5 py-4 flex-row items-center justify-between" onPress={() => setShowCart(true)}>
              <Text className="text-white font-sans-bold text-base">🛒 {count} item</Text>
              <Text className="text-white font-sans-extrabold text-lg">{fmt(total)}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        /* Cart fullscreen */
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-3 bg-muted">
            <Text className="text-sm font-sans-bold text-foreground uppercase tracking-wider">Keranjang ({count})</Text>
            <Pressable onPress={() => setShowCart(false)}><X size={22} color={Colors.gray[600]} /></Pressable>
          </View>
          {cart.length === 0 ? (
            <View className="flex-1 items-center justify-center"><Text className="text-gray-400 font-sans">Keranjang kosong</Text></View>
          ) : (
            <FlashList
              data={cart}
              estimatedItemSize={72}
              renderItem={({ item }) => (
                <View className="flex-row items-center px-4 py-3 border-b-2 border-muted">
                  <View className="flex-1">
                    <Text className="text-sm font-sans-bold text-foreground">{item.name}</Text>
                    <Text className="text-xs font-sans text-gray-500">{fmt(item.price)}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Pressable className="w-8 h-8 rounded-md bg-muted items-center justify-center" onPress={() => updateQty(item.id, -1)}>
                      <Minus size={14} color={Colors.gray[600]} strokeWidth={2.5} />
                    </Pressable>
                    <Text className="text-sm font-sans-bold w-6 text-center">{item.qty}</Text>
                    <Pressable className="w-8 h-8 rounded-md bg-primary items-center justify-center" onPress={() => updateQty(item.id, 1)}>
                      <Plus size={14} color="#FFF" strokeWidth={2.5} />
                    </Pressable>
                    <Pressable className="w-8 h-8 rounded-md bg-red-100 items-center justify-center ml-1" onPress={() => removeItem(item.id)}>
                      <Trash2 size={14} color="#EF4444" strokeWidth={2} />
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
          <View className="p-4 bg-muted">
            <View className="flex-row justify-between mb-3">
              <Text className="text-sm font-sans-medium text-gray-500 uppercase tracking-wider">Total</Text>
              <Text className="text-2xl font-sans-extrabold text-foreground" style={{ letterSpacing: -0.5 }}>{fmt(total)}</Text>
            </View>
            <Pressable className={`h-16 rounded-md items-center justify-center flex-row ${cart.length > 0 ? "bg-secondary" : "bg-gray-300"}`} disabled={cart.length === 0}>
              <CreditCard size={22} color="#FFF" strokeWidth={2.5} />
              <Text className="ml-3 text-lg font-sans-bold text-white">Proses Pembayaran</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
