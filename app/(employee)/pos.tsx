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
  Printer,
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
import { sanitizeCurrency } from "@/utils/currency";
import { printReceipt, type ReceiptInput } from "@/services/printer";

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
  const [successTxn, setSuccessTxn] = useState<ReceiptInput | null>(null);

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
        className="bg-kumo-base border border-kumo-hairline rounded-lg p-3 mx-1.5 my-1.5"
        style={{ width: cardWidth }}
        onPress={() => addItem(item)}
      >
        <View className="w-full aspect-square rounded-md bg-kumo-fill items-center justify-center mb-2">
          <Package size={28} color={Colors.gray[400]} strokeWidth={2} />
        </View>
        <Text
          className="text-sm font-sans-semibold text-kumo-default"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="text-base font-sans-semibold text-kumo-brand mt-1">
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

  const paid = payMethod === "cash" ? sanitizeCurrency(paidInput) : total;
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
      setSuccessTxn({
        employeeName: user.name,
        transactionId: undefined,
        createdAt: Date.now(),
        items: cart.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
        })),
        total,
        paymentMethod: payMethod,
        paid,
        change: Math.max(0, paid - total),
      });
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

  const handlePrintReceipt = async () => {
    if (!successTxn) return;
    try {
      await printReceipt(successTxn);
    } catch (err: any) {
      Alert.alert("Gagal mencetak", err?.message || "Tidak dapat membuka printer.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-kumo-base">
      {!showCart ? (
        <View className="flex-1">
          <View className="px-4 pt-4 pb-1 flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-sans-semibold text-kumo-subtle  ">
                Menu Kasir
              </Text>
              <Text
                className="text-2xl font-sans-semibold text-kumo-default mt-0.5"

              >
                Kasir
              </Text>
            </View>
            {count > 0 && (
              <View className="bg-kumo-brand rounded-lg shadow-kumo-primary px-3 py-2 flex-row items-center">
                <Text className="text-kumo-inverse font-sans-semibold text-sm">
                  {count} item
                </Text>
              </View>
            )}
          </View>

          {!shift && (
            <View className="mx-4 mt-2 bg-kumo-warning-tint rounded-lg px-4 py-3 flex-row items-center">
              <AlertTriangle
                size={18}
                color={Colors.accent.DEFAULT}
                strokeWidth={2}
              />
              <Text className="ml-2 flex-1 text-xs font-sans-semibold text-kumo-warning">
                Belum ada shift aktif. Mulai shift di tab Dashboard untuk
                bertransaksi.
              </Text>
            </View>
          )}

          <View className="px-4 pt-3 pb-2">
            <View className="flex-row items-center bg-kumo-fill rounded-md px-4">
              <Search size={18} color={Colors.gray[400]} strokeWidth={2} />
              <TextInput
                className="flex-1 h-12 ml-3 text-base text-kumo-default font-sans"
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
                  activeCat === "Semua" ? "bg-kumo-brand" : "bg-kumo-fill"
                }`}
                onPress={() => setActiveCat("Semua")}
              >
                <Text
                  className={`text-sm font-sans-semibold ${
                    activeCat === "Semua" ? "text-kumo-inverse" : "text-kumo-subtle"
                  }`}
                >
                  Semua
                </Text>
              </Pressable>
              {categories.map((cat: any) => (
                <Pressable
                  key={cat.id}
                  className={`px-4 py-2 rounded-md ${
                    activeCat === cat.id ? "bg-kumo-brand" : "bg-kumo-fill"
                  }`}
                  onPress={() => setActiveCat(cat.id)}
                >
                  <Text
                    className={`text-sm font-sans-semibold ${
                      activeCat === cat.id ? "text-kumo-inverse" : "text-kumo-subtle"
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
              <Text className="text-base font-sans-medium text-kumo-subtle mt-4">
                Belum ada produk
              </Text>
              <Text className="text-sm font-sans text-kumo-subtle mt-1 text-center px-8">
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
              className="absolute bottom-4 left-4 right-4 bg-kumo-brand rounded-lg px-5 py-4 flex-row items-center justify-between"
              onPress={() => setShowCart(true)}
            >
              <Text className="text-kumo-inverse font-sans-semibold text-base">
                {count} item
              </Text>
              <Text className="text-kumo-inverse font-sans-semibold text-lg">
                {fmt(total)}
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-3 bg-kumo-fill">
            <Text className="text-sm font-sans-semibold text-kumo-default  ">
              Keranjang ({count})
            </Text>
            <Pressable onPress={() => setShowCart(false)}>
              <X size={22} color={Colors.gray[600]} />
            </Pressable>
          </View>
          {cart.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-kumo-subtle font-sans">Keranjang kosong</Text>
            </View>
          ) : (
            <FlashList
              data={cart}
              renderItem={({ item }) => (
                <View className="flex-row items-center px-4 py-3 border-b border-kumo-line">
                  <View className="flex-1">
                    <Text className="text-sm font-sans-semibold text-kumo-default">
                      {item.name}
                    </Text>
                    <Text className="text-xs font-sans text-kumo-subtle">
                      {fmt(item.price)} x {item.qty}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      className="w-8 h-8 rounded-md bg-kumo-fill items-center justify-center"
                      onPress={() => updateQty(item.productId, -1)}
                    >
                      <Minus
                        size={14}
                        color={Colors.gray[600]}
                        strokeWidth={2.5}
                      />
                    </Pressable>
                    <Text className="text-sm font-sans-semibold w-6 text-center">
                      {item.qty}
                    </Text>
                    <Pressable
                      className="w-8 h-8 rounded-md bg-kumo-brand items-center justify-center"
                      onPress={() => updateQty(item.productId, 1)}
                    >
                      <Plus size={14} color="#FFF" strokeWidth={2.5} />
                    </Pressable>
                    <Pressable
                      className="w-8 h-8 rounded-md bg-kumo-danger-tint items-center justify-center ml-1"
                      onPress={() => removeItem(item.productId)}
                    >
                      <Trash2 size={14} color="#EF4444" strokeWidth={2} />
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
          <View className="p-4 bg-kumo-fill">
            <View className="flex-row justify-between mb-3">
              <Text className="text-sm font-sans-medium text-kumo-subtle  ">
                Total
              </Text>
              <Text
                className="text-2xl font-sans-semibold text-kumo-default"

              >
                {fmt(total)}
              </Text>
            </View>
            <Pressable
              className={`h-16 rounded-lg items-center justify-center flex-row ${
                cart.length > 0 ? "bg-kumo-success" : "bg-kumo-fill"
              }`}
              disabled={cart.length === 0}
              onPress={openPayment}
            >
              <Banknote size={22} color="#FFF" strokeWidth={2.5} />
              <Text className="ml-3 text-lg font-sans-semibold text-kumo-inverse">
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
              <View className="w-20 h-20 rounded-full bg-kumo-success-tint items-center justify-center">
                <Check size={40} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
              </View>
              <Text className="text-2xl font-sans-semibold text-kumo-default mt-5">
                Transaksi Berhasil
              </Text>
              <Text className="text-sm font-sans text-kumo-subtle mt-1">
                Pembayaran {PAY_METHODS.find((m) => m.key === payMethod)?.label}
              </Text>
              <Text
                className="text-3xl font-sans-semibold text-kumo-default mt-4"

              >
                {fmt(successTxn.total)}
              </Text>
              <View className="bg-kumo-base border border-kumo-hairline rounded-lg p-4 mt-4 w-full">
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-sm font-sans text-kumo-subtle">Total</Text>
                  <Text className="text-sm font-sans-semibold text-kumo-default">{fmt(successTxn.total)}</Text>
                </View>
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-sm font-sans text-kumo-subtle">Dibayar</Text>
                  <Text className="text-sm font-sans-semibold text-kumo-default">{fmt(successTxn.paid)}</Text>
                </View>
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-sm font-sans text-kumo-subtle">Kembalian</Text>
                  <Text className="text-sm font-sans-semibold text-kumo-success">
                    {fmt(Math.max(0, successTxn.paid - successTxn.total))}
                  </Text>
                </View>
              </View>
              <Pressable
                className="h-14 bg-kumo-success rounded-md items-center justify-center mt-6 w-full flex-row"
                onPress={handlePrintReceipt}
              >
                <Printer size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-base font-sans-semibold text-kumo-inverse ml-2">
                  Cetak Struk
                </Text>
              </Pressable>
              <Pressable
                className="h-14 bg-kumo-brand shadow-kumo-primary rounded-lg items-center justify-center mt-3 w-full"
                onPress={closePayment}
              >
                <Text className="text-base font-sans-semibold text-kumo-inverse">
                  Transaksi Baru
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Ringkasan */}
              <View className="bg-kumo-base border border-kumo-hairline rounded-lg p-4 mb-4">
                {cart.map((i) => (
                  <View
                    key={i.productId}
                    className="flex-row justify-between py-1"
                  >
                    <Text className="text-sm font-sans text-kumo-subtle flex-1 pr-3" numberOfLines={1}>
                      {i.name} x {i.qty}
                    </Text>
                    <Text className="text-sm font-sans-semibold text-kumo-default">
                      {fmt(i.price * i.qty)}
                    </Text>
                  </View>
                ))}
                <View className="h-0.5 bg-kumo-fill my-2" />
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-sans-medium text-kumo-subtle  ">
                    Total
                  </Text>
                  <Text
                    className="text-xl font-sans-semibold text-kumo-default"

                  >
                    {fmt(total)}
                  </Text>
                </View>
              </View>

              {/* Metode Pembayaran */}
              <Text className="text-sm font-sans-semibold text-kumo-subtle mb-2">
                Metode Pembayaran
              </Text>
              <View className="flex-row gap-2 mb-4">
                {PAY_METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = payMethod === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      className={`flex-1 h-14 rounded-lg items-center justify-center flex-row ${
                        active ? "bg-kumo-brand" : "bg-kumo-fill"
                      }`}
                      onPress={() => setPayMethod(m.key)}
                    >
                      <Icon
                        size={18}
                        color={active ? "#FFF" : Colors.gray[600]}
                        strokeWidth={2.5}
                      />
                      <Text
                        className={`ml-2 text-sm font-sans-semibold ${
                          active ? "text-kumo-inverse" : "text-kumo-default"
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
                      className="h-14 rounded-lg items-center justify-center px-5 bg-kumo-success-tint"
                      onPress={() => setPaidInput(String(total))}
                    >
                      <Text className="text-sm font-sans-semibold text-kumo-success">
                        Uang Pas
                      </Text>
                    </Pressable>
                  </View>
                  {paidInput !== "" && (
                    <View className="mt-3">
                      {change >= 0 ? (
                        <View className="flex-row items-center bg-kumo-success-tint rounded-md px-4 py-3">
                          <Text className="text-sm font-sans-semibold text-kumo-success">
                            Kembalian {fmt(change)}
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center bg-kumo-danger-tint rounded-md px-4 py-3">
                          <Text className="text-sm font-sans-semibold text-kumo-danger">
                            Kurang {fmt(Math.abs(change))}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              <Pressable
                className={`h-16 rounded-lg items-center justify-center ${
                  paidValid && cart.length > 0 ? "bg-kumo-brand" : "bg-kumo-fill"
                }`}
                disabled={!paidValid || cart.length === 0 || processing}
                onPress={handlePay}
              >
                <Text className="text-lg font-sans-semibold text-kumo-inverse">
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
