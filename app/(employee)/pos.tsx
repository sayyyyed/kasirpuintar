import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  useWindowDimensions,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  QrCode,
  Landmark,
  Check,
  Package,
  X,
  AlertTriangle,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/useAuth";
import { useShift } from "@/hooks/useShift";
import SheetModal from "@/components/ui/SheetModal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { createTransaction } from "@/services/repositories/transactionRepository";
import { updateShiftTotals } from "@/services/repositories/shiftRepository";
import { pullChanges } from "@/services/sync";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const PAY_METHODS = [
  { key: "cash", label: "Tunai", icon: Banknote },
  { key: "qris", label: "QRIS", icon: QrCode },
  { key: "transfer", label: "Transfer", icon: Landmark },
] as const;

type PayMethod = "cash" | "qris" | "transfer";

export default function POSScreen() {
  const { width: screenW } = useWindowDimensions();
  const numColumns = screenW < 500 ? 3 : screenW < 700 ? 4 : screenW < 900 ? 5 : 6;
  const cardWidth = (screenW - 8 - numColumns * 12) / numColumns;

  const { user } = useAuth();
  const { shift } = useShift(user?.id || "");
  const products = useProducts();
  const categories = useCategories();
  const {
    items: cart,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    total,
    count,
  } = useCart();

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Semua");
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [paidInput, setPaidInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successTxn, setSuccessTxn] = useState<{
    total: number;
    change: number;
  } | null>(null);

  useEffect(() => {
    pullChanges().catch(() => {});
  }, []);

  const categoryNames = useMemo(() => {
    const map: Record<string, string> = { Semua: "Semua" };
    categories.forEach((c: any) => (map[c.id] = c.name));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products
      .filter((p: any) => {
        const matchSearch = !q || (p.name || "").toLowerCase().includes(q);
        const matchCat =
          activeCat === "Semua" || p.category_id === activeCat;
        return matchSearch && matchCat;
      })
      .sort((a: any, b: any) =>
        (a.name || "").localeCompare(b.name || "")
      );
  }, [search, activeCat, products]);

  const renderProduct = useCallback(
    ({ item }: { item: any }) => (
      <Pressable
        className="bg-muted rounded-lg p-3 mx-1.5 my-1.5"
        style={{ width: cardWidth }}
        onPress={() => addItem(item)}
      >
        <View className="w-full aspect-square rounded-md bg-gray-200 items-center justify-center mb-2">
          <Package size={28} color={Colors.gray[400]} strokeWidth={2} />
        </View>
        <Text
          className="text-sm font-sans-bold text-foreground"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="text-base font-sans-bold text-primary mt-1">
          {fmt(item.price || 0)}
        </Text>
      </Pressable>
    ),
    [addItem, cardWidth]
  );

  const openPayment = () => {
    if (!shift) {
      Alert.alert(
        "Belum Ada Shift",
        "Mulai shift terlebih dahulu di tab Dashboard untuk bertransaksi."
      );
      return;
    }
    setPayMethod("cash");
    setPaidInput("");
    setSuccessTxn(null);
    setShowPayment(true);
  };

  const paid = payMethod === "cash" ? Number(paidInput) || 0 : total;
  const change = paid - total;
  const paidValid = payMethod !== "cash" || paid >= total;

  const handlePay = async () => {
    if (!shift || !user || !paidValid) return;
    setProcessing(true);
    try {
      await createTransaction({
        shiftId: shift.id,
        userId: user.id,
        items: cart.map((i) => ({
          productId: i.productId,
          productName: i.name,
          price: i.price,
          cogs: i.cogs,
          qty: i.qty,
        })),
        paymentMethod: payMethod,
        paid,
      });
      await updateShiftTotals(shift.id).catch(() => {});
      setSuccessTxn({ total, change: Math.max(0, paid - total) });
      clearCart();
      setShowCart(false);
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Transaksi gagal diproses");
    } finally {
      setProcessing(false);
    }
  };

  const closePayment = () => {
    setShowPayment(false);
    setSuccessTxn(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {!showCart ? (
        <View className="flex-1">
          <View className="px-4 pt-4 pb-1 flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
                Menu Kasir
              </Text>
              <Text
                className="text-2xl font-sans-extrabold text-foreground mt-0.5"
                style={{ letterSpacing: -0.5 }}
              >
                Kasir
              </Text>
            </View>
            {count > 0 && (
              <View className="bg-primary rounded-md px-3 py-2 flex-row items-center">
                <Text className="text-white font-sans-bold text-sm">
                  {count} item
                </Text>
              </View>
            )}
          </View>

          {!shift && (
            <View className="mx-4 mt-2 bg-accent-50 rounded-lg px-4 py-3 flex-row items-center">
              <AlertTriangle
                size={18}
                color={Colors.accent.DEFAULT}
                strokeWidth={2}
              />
              <Text className="ml-2 flex-1 text-xs font-sans-semibold text-accent-600">
                Belum ada shift aktif. Mulai shift di tab Dashboard untuk
                bertransaksi.
              </Text>
            </View>
          )}

          <View className="px-4 pt-3 pb-2">
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

          <View className="px-4 pb-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
            >
              <Pressable
                className={`px-4 py-2 rounded-md ${
                  activeCat === "Semua" ? "bg-primary" : "bg-muted"
                }`}
                onPress={() => setActiveCat("Semua")}
              >
                <Text
                  className={`text-sm font-sans-semibold ${
                    activeCat === "Semua" ? "text-white" : "text-gray-600"
                  }`}
                >
                  Semua
                </Text>
              </Pressable>
              {categories.map((cat: any) => (
                <Pressable
                  key={cat.id}
                  className={`px-4 py-2 rounded-md ${
                    activeCat === cat.id ? "bg-primary" : "bg-muted"
                  }`}
                  onPress={() => setActiveCat(cat.id)}
                >
                  <Text
                    className={`text-sm font-sans-semibold ${
                      activeCat === cat.id ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {products.length === 0 ? (
            <View className="flex-1 items-center justify-center pb-16">
              <Package size={44} color={Colors.gray[300]} strokeWidth={1.5} />
              <Text className="text-base font-sans-medium text-gray-400 mt-4">
                Belum ada produk
              </Text>
              <Text className="text-sm font-sans text-gray-400 mt-1 text-center px-8">
                Produk akan muncul setelah ditambahkan pemilik & disinkronkan
              </Text>
            </View>
          ) : (
            <FlashList
              data={filtered}
              numColumns={numColumns}
              renderItem={renderProduct}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={{ padding: 4, paddingBottom: 96 }}
              showsVerticalScrollIndicator={false}
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
              renderItem={({ item }) => (
                <View className="flex-row items-center px-4 py-3 border-b-2 border-muted">
                  <View className="flex-1">
                    <Text className="text-sm font-sans-bold text-foreground">
                      {item.name}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500">
                      {fmt(item.price)} x {item.qty}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      className="w-8 h-8 rounded-md bg-muted items-center justify-center"
                      onPress={() => updateQty(item.productId, -1)}
                    >
                      <Minus
                        size={14}
                        color={Colors.gray[600]}
                        strokeWidth={2.5}
                      />
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
              onPress={openPayment}
            >
              <Banknote size={22} color="#FFF" strokeWidth={2.5} />
              <Text className="ml-3 text-lg font-sans-bold text-white">
                Proses Pembayaran
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Payment Sheet */}
      <SheetModal visible={showPayment} title="Pembayaran" onClose={closePayment}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {successTxn ? (
            <View className="items-center py-8">
              <View className="w-20 h-20 rounded-full bg-secondary-100 items-center justify-center">
                <Check size={40} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
              </View>
              <Text className="text-2xl font-sans-extrabold text-foreground mt-5">
                Transaksi Berhasil
              </Text>
              <Text className="text-sm font-sans text-gray-500 mt-1">
                Pembayaran {PAY_METHODS.find((m) => m.key === payMethod)?.label}
              </Text>
              <Text
                className="text-3xl font-sans-extrabold text-foreground mt-4"
                style={{ letterSpacing: -0.5 }}
              >
                {fmt(successTxn.total)}
              </Text>
              {successTxn.change > 0 && (
                <View className="bg-secondary-50 rounded-md px-5 py-2 mt-4">
                  <Text className="text-sm font-sans-bold text-secondary-600">
                    Kembalian {fmt(successTxn.change)}
                  </Text>
                </View>
              )}
              <Pressable
                className="h-14 bg-primary rounded-md items-center justify-center mt-8 w-full"
                onPress={closePayment}
              >
                <Text className="text-base font-sans-bold text-white">
                  Transaksi Baru
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Ringkasan */}
              <View className="bg-muted rounded-lg p-4 mb-4">
                {cart.map((i) => (
                  <View
                    key={i.productId}
                    className="flex-row justify-between py-1"
                  >
                    <Text className="text-sm font-sans text-gray-600 flex-1 pr-3" numberOfLines={1}>
                      {i.name} x {i.qty}
                    </Text>
                    <Text className="text-sm font-sans-semibold text-foreground">
                      {fmt(i.price * i.qty)}
                    </Text>
                  </View>
                ))}
                <View className="h-0.5 bg-border my-2" />
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-sans-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </Text>
                  <Text
                    className="text-xl font-sans-extrabold text-foreground"
                    style={{ letterSpacing: -0.5 }}
                  >
                    {fmt(total)}
                  </Text>
                </View>
              </View>

              {/* Metode Pembayaran */}
              <Text className="text-sm font-sans-semibold text-gray-500 mb-2">
                Metode Pembayaran
              </Text>
              <View className="flex-row gap-2 mb-4">
                {PAY_METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = payMethod === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      className={`flex-1 h-14 rounded-md items-center justify-center flex-row ${
                        active ? "bg-primary" : "bg-muted"
                      }`}
                      onPress={() => setPayMethod(m.key)}
                    >
                      <Icon
                        size={18}
                        color={active ? "#FFF" : Colors.gray[600]}
                        strokeWidth={2.5}
                      />
                      <Text
                        className={`ml-2 text-sm font-sans-bold ${
                          active ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {payMethod === "cash" && (
                <View className="mb-4">
                  <View className="flex-row gap-2 mb-2">
                    <View className="flex-1">
                      <CurrencyInput
                        value={paidInput}
                        onValueChange={(v) => setPaidInput(v)}
                        placeholder="0"
                      />
                    </View>
                    <Pressable
                      className="h-14 rounded-md items-center justify-center px-5 bg-secondary-50"
                      onPress={() => setPaidInput(String(total))}
                    >
                      <Text className="text-sm font-sans-bold text-secondary-600">
                        Uang Pas
                      </Text>
                    </Pressable>
                  </View>
                  {paidInput !== "" && (
                    <View className="mt-3">
                      {change >= 0 ? (
                        <View className="flex-row items-center bg-secondary-50 rounded-md px-4 py-3">
                          <Text className="text-sm font-sans-semibold text-secondary-600">
                            Kembalian {fmt(change)}
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center bg-red-50 rounded-md px-4 py-3">
                          <Text className="text-sm font-sans-semibold text-red-600">
                            Kurang {fmt(Math.abs(change))}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              <Pressable
                className={`h-16 rounded-md items-center justify-center ${
                  paidValid && cart.length > 0 ? "bg-primary" : "bg-gray-300"
                }`}
                disabled={!paidValid || cart.length === 0 || processing}
                onPress={handlePay}
              >
                <Text className="text-lg font-sans-bold text-white">
                  {processing
                    ? "Memproses..."
                    : `Bayar ${fmt(payMethod === "cash" ? paid : total)}`}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SheetModal>
    </SafeAreaView>
  );
}
