import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import {
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
} from "lucide-react-native";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/db";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useShift } from "@/hooks/useShift";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import SheetModal from "@/components/ui/SheetModal";
import Input from "@/components/ui/Input";
import {
  createExpenseEntry,
  deleteExpenseEntry,
} from "@/services/repositories/expenseRepository";
import { updateShiftTotals } from "@/services/repositories/shiftRepository";
import { pullChanges } from "@/services/sync";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const INCOME_CATS = ["Modal", "Piutang", "Bonus", "Lainnya"];
const EXPENSE_CATS = ["Operasional", "Belanja", "Pribadi", "Lainnya"];

type EntryType = "income" | "expense";

export default function InventoryScreen() {
  const { user } = useAuth();
  const { shift } = useShift(user?.id || "");
  const products = useProducts();
  const categories = useCategories();

  const [search, setSearch] = useState("");
  const [txns, setTxns] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("expense");
  const [entryCat, setEntryCat] = useState(EXPENSE_CATS[0]);
  const [entryName, setEntryName] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    pullChanges().catch(() => {});
  }, []);

  useEffect(() => {
    if (!shift?.id) {
      setTxns([]);
      setEntries([]);
      return;
    }
    const tSub = database
      .get("transactions")
      .query(Q.where("shift_id", Q.eq(shift.id)))
      .observe()
      .subscribe((records: any[]) => setTxns([...records]));
    const eSub = database
      .get("expenses")
      .query(
        Q.where("shift_id", Q.eq(shift.id)),
        Q.where("deleted_at", Q.eq(null))
      )
      .observe()
      .subscribe((records: any[]) => setEntries([...records].reverse()));
    return () => {
      tSub.unsubscribe();
      eSub.unsubscribe();
    };
  }, [shift?.id]);

  const salesTotal = useMemo(
    () => txns.reduce((s, t: any) => s + (t.total || 0), 0),
    [txns]
  );
  const incomeManual = useMemo(
    () =>
      entries
        .filter((e: any) => e.type === "income")
        .reduce((s, e: any) => s + (e.amount || 0), 0),
    [entries]
  );
  const expenseTotal = useMemo(
    () =>
      entries
        .filter((e: any) => e.type !== "income")
        .reduce((s, e: any) => s + (e.amount || 0), 0),
    [entries]
  );

  const pemasukan = salesTotal + incomeManual;
  const pengeluaran = expenseTotal;

  const categoryNames = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c: any) => (map[c.id] = c.name));
    return map;
  }, [categories]);

  const lowStockCount = useMemo(
    () => products.filter((p: any) => (p.stock || 0) <= 10).length,
    [products]
  );

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p: any) =>
      (p.name || "").toLowerCase().includes(q)
    );
  }, [search, products]);

  const openEntry = (type: EntryType) => {
    if (!shift) {
      Alert.alert(
        "Belum Ada Shift",
        "Mulai shift terlebih dahulu di tab Dashboard untuk mencatat kas."
      );
      return;
    }
    setEntryType(type);
    setEntryCat(type === "income" ? INCOME_CATS[0] : EXPENSE_CATS[0]);
    setEntryName("");
    setEntryAmount("");
    setEntryNote("");
    setShowModal(true);
  };

  const handleSaveEntry = async () => {
    if (!shift || !user) return;
    const amount = Number(entryAmount);
    if (!entryName.trim()) {
      Alert.alert("Error", "Isi keterangan terlebih dahulu");
      return;
    }
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Jumlah harus lebih dari 0");
      return;
    }
    setSaving(true);
    try {
      await createExpenseEntry({
        shiftId: shift.id,
        userId: user.id,
        name: entryName.trim(),
        category: entryCat,
        amount,
        type: entryType,
        note: entryNote.trim() || undefined,
      });
      await updateShiftTotals(shift.id).catch(() => {});
      setShowModal(false);
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal menyimpan catatan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = (entry: any) => {
    Alert.alert("Hapus Catatan", `Hapus "${entry.name}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await deleteExpenseEntry(entry.id);
          if (shift) await updateShiftTotals(shift.id).catch(() => {});
        },
      },
    ]);
  };

  const header = (
    <View>
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
          Pantau Stok & Kas
        </Text>
        <Text
          className="text-2xl font-sans-extrabold text-foreground mt-1"
          style={{ letterSpacing: -0.5 }}
        >
          Stok
        </Text>
      </View>

      {/* Balance Cards */}
      <View className="px-6 mb-4">
        <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
          Balance Shift Ini
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1 bg-secondary-50 rounded-lg p-5">
            <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center mb-3">
              <TrendingUp
                size={18}
                color={Colors.secondary.DEFAULT}
                strokeWidth={2.5}
              />
            </View>
            <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider">
              Pemasukan
            </Text>
            <Text
              className="text-lg font-sans-extrabold text-foreground mt-1"
              style={{ letterSpacing: -0.5 }}
            >
              {fmt(pemasukan)}
            </Text>
          </View>
          <View className="flex-1 bg-accent-50 rounded-lg p-5">
            <View className="w-10 h-10 rounded-full bg-accent-100 items-center justify-center mb-3">
              <TrendingDown
                size={18}
                color={Colors.accent.DEFAULT}
                strokeWidth={2.5}
              />
            </View>
            <Text className="text-xs font-sans-medium text-gray-500 uppercase tracking-wider">
              Pengeluaran
            </Text>
            <Text
              className="text-lg font-sans-extrabold text-foreground mt-1"
              style={{ letterSpacing: -0.5 }}
            >
              {fmt(pengeluaran)}
            </Text>
          </View>
        </View>

        {/* Tambah */}
        <View className="flex-row gap-2 mt-4">
          <Pressable
            className={`flex-1 h-14 rounded-md items-center justify-center flex-row ${
              shift ? "bg-secondary" : "bg-gray-300"
            }`}
            disabled={!shift}
            onPress={() => openEntry("income")}
          >
            <ArrowDownToLine size={20} color="#FFF" strokeWidth={2.5} />
            <Text className="ml-2 text-base font-sans-bold text-white">
              Pemasukan
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 h-14 rounded-md items-center justify-center flex-row ${
              shift ? "bg-accent" : "bg-gray-300"
            }`}
            disabled={!shift}
            onPress={() => openEntry("expense")}
          >
            <ArrowUpFromLine size={20} color="#FFF" strokeWidth={2.5} />
            <Text className="ml-2 text-base font-sans-bold text-white">
              Pengeluaran
            </Text>
          </Pressable>
        </View>
        {!shift && (
          <View className="flex-row items-center mt-3 bg-accent-50 rounded-md px-4 py-3">
            <AlertTriangle
              size={16}
              color={Colors.accent.DEFAULT}
              strokeWidth={2}
            />
            <Text className="ml-2 flex-1 text-xs font-sans-semibold text-accent-600">
              Mulai shift di Dashboard untuk mencatat pemasukan/pengeluaran
            </Text>
          </View>
        )}
      </View>

      {/* Entry List */}
      <View className="px-6 mb-6">
        <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider mb-3">
          Riwayat Kas ({entries.length})
        </Text>
        {entries.length === 0 ? (
          <View className="bg-muted rounded-lg p-6 items-center">
            <Wallet size={28} color={Colors.gray[300]} strokeWidth={2} />
            <Text className="text-sm font-sans-medium text-gray-400 mt-3">
              Belum ada catatan kas
            </Text>
            <Text className="text-xs font-sans text-gray-400 mt-1">
              Tambah pemasukan atau pengeluaran shift ini
            </Text>
          </View>
        ) : (
          entries.map((e: any) => {
            const isIncome = e.type === "income";
            return (
              <View
                key={e.id}
                className="flex-row items-center py-3 border-b-2 border-muted"
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    isIncome ? "bg-secondary-100" : "bg-accent-100"
                  }`}
                >
                  {isIncome ? (
                    <ArrowDownToLine
                      size={18}
                      color={Colors.secondary.DEFAULT}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <ArrowUpFromLine
                      size={18}
                      color={Colors.accent.DEFAULT}
                      strokeWidth={2.5}
                    />
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-sans-bold text-foreground">
                    {e.name}
                  </Text>
                  <Text className="text-xs font-sans text-gray-400 mt-0.5">
                    {e.category} ·{" "}
                    {e.createdAt
                      ? e.createdAt.toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className={`text-sm font-sans-extrabold ${
                      isIncome ? "text-secondary-600" : "text-accent-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {fmt(e.amount || 0)}
                  </Text>
                  <Pressable onPress={() => handleDeleteEntry(e)} hitSlop={8}>
                    <Text className="text-[10px] font-sans-semibold text-gray-400 uppercase mt-1">
                      Hapus
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Product section */}
      <View className="px-6 mb-3">
        <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
          Daftar Produk
        </Text>
      </View>

      {lowStockCount > 0 && (
        <View className="mx-6 mb-3 flex-row items-center bg-accent-50 rounded-lg px-4 py-3">
          <AlertTriangle
            size={18}
            color={Colors.accent.DEFAULT}
            strokeWidth={2}
          />
          <Text className="ml-2 text-sm font-sans-semibold text-accent-600">
            {lowStockCount} produk stok rendah
          </Text>
        </View>
      )}

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
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {products.length === 0 && search === "" ? (
        <ScrollView keyboardShouldPersistTaps="handled">
          {header}
          <View className="items-center justify-center py-12">
            <Package size={44} color={Colors.gray[300]} strokeWidth={1.5} />
            <Text className="text-base font-sans-medium text-gray-400 mt-4">
              Belum ada data produk
            </Text>
            <Text className="text-sm font-sans text-gray-400 mt-1 text-center px-8">
              Produk akan muncul setelah ditambahkan pemilik & disinkronkan
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlashList
          data={filtered}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => {
            const isLow = (item.stock || 0) <= 10;
            return (
              <View className="flex-row items-center px-6 py-4 border-b-2 border-muted">
                <View className="flex-1">
                  <Text className="text-base font-sans-bold text-foreground">
                    {item.name}
                  </Text>
                  <Text className="text-xs font-sans text-gray-500 mt-0.5">
                    {categoryNames[item.category_id] || "Tanpa Kategori"}
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
                  <Text className="text-xs font-sans text-gray-400">
                    {isLow ? "Stok rendah" : "pcs"}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Entry Sheet */}
      <SheetModal
        visible={showModal}
        title="Catat Kas"
        onClose={() => setShowModal(false)}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          {/* Type picker */}
          <View className="flex-row gap-2 mb-4">
            <Pressable
              className={`flex-1 h-14 rounded-md items-center justify-center flex-row ${
                entryType === "income" ? "bg-secondary" : "bg-muted"
              }`}
              onPress={() => {
                setEntryType("income");
                setEntryCat(INCOME_CATS[0]);
              }}
            >
              <ArrowDownToLine
                size={18}
                color={entryType === "income" ? "#FFF" : Colors.gray[600]}
                strokeWidth={2.5}
              />
              <Text
                className={`ml-2 text-sm font-sans-bold ${
                  entryType === "income" ? "text-white" : "text-gray-700"
                }`}
              >
                Pemasukan
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 h-14 rounded-md items-center justify-center flex-row ${
                entryType === "expense" ? "bg-accent" : "bg-muted"
              }`}
              onPress={() => {
                setEntryType("expense");
                setEntryCat(EXPENSE_CATS[0]);
              }}
            >
              <ArrowUpFromLine
                size={18}
                color={entryType === "expense" ? "#FFF" : Colors.gray[600]}
                strokeWidth={2.5}
              />
              <Text
                className={`ml-2 text-sm font-sans-bold ${
                  entryType === "expense" ? "text-white" : "text-gray-700"
                }`}
              >
                Pengeluaran
              </Text>
            </Pressable>
          </View>

          {/* Kategori chips */}
          <Text className="text-sm font-sans-semibold text-gray-500 mb-2">
            Kategori
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {(entryType === "income" ? INCOME_CATS : EXPENSE_CATS).map(
              (cat) => (
                <Pressable
                  key={cat}
                  className={`px-4 py-2 rounded-md ${
                    entryCat === cat ? "bg-primary" : "bg-muted"
                  }`}
                  onPress={() => setEntryCat(cat)}
                >
                  <Text
                    className={`text-sm font-sans-semibold ${
                      entryCat === cat ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {cat}
                  </Text>
                </Pressable>
              )
            )}
          </View>

          <View className="gap-4">
            <Input
              label="Keterangan"
              placeholder={
                entryType === "income"
                  ? "Contoh: Uang modal dari pemilik"
                  : "Contoh: Beli galon untuk usaha"
              }
              value={entryName}
              onChangeText={setEntryName}
            />
            <Input
              label="Jumlah (Rp)"
              placeholder="0"
              keyboardType="number-pad"
              value={entryAmount}
              onChangeText={(v) => setEntryAmount(v.replace(/[^0-9]/g, ""))}
            />
            <Input
              label="Catatan (opsional)"
              placeholder="Tambahan catatan"
              value={entryNote}
              onChangeText={setEntryNote}
            />
            <Pressable
              className={`h-16 rounded-md items-center justify-center flex-row mt-2 ${
                saving ? "bg-primary-600" : "bg-primary"
              }`}
              onPress={handleSaveEntry}
              disabled={saving}
            >
              <Plus size={20} color="#FFF" strokeWidth={2.5} />
              <Text className="ml-2 text-lg font-sans-bold text-white">
                {saving ? "Menyimpan..." : "Simpan Catatan"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SheetModal>
    </SafeAreaView>
  );
}
