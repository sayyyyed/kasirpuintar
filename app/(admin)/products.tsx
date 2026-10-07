import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import {
  Search,
  Plus,
  Package,
  LayoutGrid,
  Trash2,
} from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from "@/services/repositories/productRepository";
import {
  createCategory,
  getAllCategories,
} from "@/services/repositories/categoryRepository";
import SheetModal from "@/components/ui/SheetModal";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { sanitizeCurrency } from "@/utils/currency";

const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

type ProductForm = {
  name: string;
  sku: string;
  price: string;
  cogs: string;
  stock: string;
  categoryId: string;
};

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  price: "",
  cogs: "",
  stock: "",
  categoryId: "",
};

export default function ProductsScreen() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Semua");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [isSaving, setIsSaving] = useState(false);

  const loadProducts = async () => {
    const data = await searchProducts("");
    setProducts(data || []);
  };

  const loadCategories = async () => {
    const data = await getAllCategories();
    setCategories(data || []);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p: any) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q)
      );
    }
    if (activeCat !== "Semua") {
      list = list.filter((p: any) => p.category_id === activeCat);
    }
    return list;
  }, [search, activeCat, products]);

  const totalProducts = products.length;
  const totalCategories = categories.length;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      sku: item.sku || "",
      price: String(item.price || 0),
      cogs: String(item.cogs || 0),
      stock: "",
      categoryId: item.category_id || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("Error", "Nama produk wajib diisi");
      return;
    }
    if (!form.categoryId) {
      Alert.alert("Error", "Pilih kategori terlebih dahulu");
      return;
    }
    setIsSaving(true);
    try {
      const input = {
        sku: form.sku.trim() || form.name.trim().slice(0, 3).toUpperCase(),
        name: form.name.trim(),
        price: sanitizeCurrency(form.price),
        cogs: sanitizeCurrency(form.cogs),
        categoryId: form.categoryId,
      };
      if (editingId) {
        await updateProduct(editingId, input);
      } else {
        await createProduct(input);
      }
      setShowModal(false);
      await loadProducts();
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal menyimpan produk");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item: any) => {
    Alert.alert("Hapus Produk", `Hapus "${item.name}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await deleteProduct(item.id);
          await loadProducts();
        },
      },
    ]);
  };

  const catTabs = [
    "Semua",
    ...categories.map((c: any) => c.id),
  ];
  const catNames: Record<string, string> = { Semua: "Semua" };
  categories.forEach((c: any) => {
    catNames[c.id] = c.name;
  });

  return (
    <SafeAreaView className="flex-1 bg-kumo-base">
      <View className="px-6 pt-6 pb-2 flex-row items-end justify-between">
        <View>
          <Text className="text-sm font-sans-semibold text-kumo-subtle  ">
            Menu
          </Text>
          <Text
            className="text-2xl font-sans-semibold text-kumo-default mt-1"

          >
            Produk
          </Text>
        </View>
        <Pressable
          className="bg-kumo-brand rounded-md px-4 py-3 flex-row items-center"
          onPress={openCreate}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-sm font-sans-semibold text-kumo-inverse ml-2">Tambah</Text>
        </Pressable>
      </View>

      <View className="px-6 py-4 flex-row gap-3">
        <View className="flex-1 bg-kumo-info-tint rounded-lg p-4">
          <View className="w-10 h-10 rounded-full bg-kumo-info-tint items-center justify-center mb-2">
            <Package size={18} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
          </View>
          <Text className="text-xl font-sans-semibold text-kumo-default">
            {totalProducts}
          </Text>
          <Text className="text-xs font-sans-semibold text-kumo-subtle   mt-1">
            Menu
          </Text>
        </View>
        <View className="flex-1 bg-kumo-success-tint rounded-lg p-4">
          <View className="w-10 h-10 rounded-full bg-kumo-success-tint items-center justify-center mb-2">
            <LayoutGrid size={18} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
          </View>
          <Text className="text-xl font-sans-semibold text-kumo-default">
            {totalCategories}
          </Text>
          <Text className="text-xs font-sans-semibold text-kumo-subtle   mt-1">
            Kategori
          </Text>
        </View>
      </View>

      <View className="px-6 pb-2">
        <View className="flex-row items-center bg-kumo-fill rounded-md px-4">
          <Search size={18} color={Colors.gray[400]} strokeWidth={2} />
          <TextInput
            className="flex-1 h-12 ml-3 text-base text-kumo-default font-sans"
            placeholder="Cari produk atau SKU..."
            placeholderTextColor={Colors.gray[400]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View className="px-6 pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {catTabs.map((cat) => {
            const isActive = activeCat === cat;
            return (
              <Pressable
                key={cat}
                className={`px-5 py-2.5 rounded-md ${
                  isActive ? "bg-kumo-brand" : "bg-kumo-fill"
                }`}
                style={{ minWidth: 64 }}
                onPress={() => setActiveCat(cat)}
              >
                <Text
                  className={`text-sm font-sans-semibold text-center ${
                    isActive ? "text-kumo-inverse" : "text-kumo-subtle"
                  }`}
                >
                  {catNames[cat] || cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {products.length === 0 ? (
        <View className="flex-1 items-center justify-center py-12">
          <Package size={40} color={Colors.gray[300]} strokeWidth={1.5} />
          <Text className="text-base font-sans-medium text-kumo-subtle mt-3">
            Belum ada produk
          </Text>
          <Text className="text-sm font-sans text-kumo-subtle mt-1">
            Tambahkan produk via tombol Tambah
          </Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
          renderItem={({ item }: { item: any }) => {
            const margin = (item.price || 0) - (item.cogs || 0);
            const marginPct = item.price
              ? Math.round((margin / item.price) * 100)
              : 0;
            return (
              <View className="flex-row items-center py-4 border-b border-kumo-line">
                <Pressable className="flex-row flex-1 items-center" onPress={() => openEdit(item)}>
                  <View
                    className="w-14 h-14 rounded-lg items-center justify-center bg-kumo-fill"
                  >
                    <Text className="text-xl">📦</Text>
                  </View>

                  <View className="ml-4 flex-1">
                    <Text className="text-base font-sans-semibold text-kumo-default">
                      {item.name}
                    </Text>
                    <Text className="text-xs font-sans text-kumo-subtle mt-0.5">
                      SKU: {item.sku || "-"}
                    </Text>
                    <View className="flex-row items-center mt-1 gap-3">
                      <Text className="text-xs font-sans-medium text-kumo-brand">
                        {fmt(item.price || 0)}
                      </Text>
                      <Text className="text-xs font-sans text-kumo-subtle">
                        COGS: {fmt(item.cogs || 0)}
                      </Text>
                      {marginPct > 0 && (
                        <Text className="text-xs font-sans-semibold text-kumo-success">
                          +{marginPct}%
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>

                <Pressable
                  className="ml-2 w-10 h-10 items-center justify-center"
                  onPress={() => handleDelete(item)}
                >
                  <Trash2 size={18} color={Colors.gray[400]} strokeWidth={2} />
                </Pressable>
              </View>
            );
          }}
        />
      )}

      {/* SheetModal Form */}
      <SheetModal
        visible={showModal}
        title={editingId ? "Edit Produk" : "Tambah Produk"}
        onClose={() => setShowModal(false)}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View className="gap-4">
            <Field
              label="Nama Produk"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Nasi Goreng"
            />
            <Field
              label="SKU"
              value={form.sku}
              onChangeText={(v) => setForm({ ...form, sku: v })}
              placeholder="NSGR-001"
            />
            <Field
              label="Harga Jual"
              value={form.price}
              onChangeText={(v) => setForm({ ...form, price: v })}
              placeholder="15000"
              currency
            />
            <Field
              label="Harga Pokok / COGS"
              value={form.cogs}
              onChangeText={(v) => setForm({ ...form, cogs: v })}
              placeholder="8000"
              currency
            />

            <View>
              <Text className="text-sm font-sans-semibold text-kumo-subtle mb-2">
                Kategori
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {categories.map((c: any) => (
                  <Pressable
                    key={c.id}
                    className={`px-4 py-2 rounded-md ${
                      form.categoryId === c.id ? "bg-kumo-brand" : "bg-kumo-fill"
                    }`}
                    onPress={() =>
                      setForm({ ...form, categoryId: c.id })
                    }
                  >
                    <Text
                      className={`text-sm font-sans-semibold ${
                        form.categoryId === c.id
                          ? "text-kumo-inverse"
                          : "text-kumo-subtle"
                      }`}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
                {categories.length === 0 && (
                  <Text className="text-sm text-kumo-subtle">
                    Belum ada kategori. Buat dulu di bawah.
                  </Text>
                )}
              </ScrollView>
            </View>

            <Pressable
              className={`h-14 rounded-md items-center justify-center mt-2 ${
                isSaving ? "bg-kumo-brand" : "bg-kumo-brand"
              }`}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text className="text-lg font-sans-semibold text-kumo-inverse">
                {isSaving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
              </Text>
            </Pressable>

            <View className="h-0.5 bg-kumo-fill my-4" />

            <Text className="text-sm font-sans-semibold text-kumo-subtle  ">
              Tambah Kategori Baru
            </Text>
            <CategoryQuickAdd onCreated={() => loadCategories()} />
          </View>
        </ScrollView>
      </SheetModal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  currency,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  currency?: boolean;
}) {
  if (currency) {
    return (
      <CurrencyInput
        label={label}
        value={value}
        onValueChange={onChangeText}
        placeholder={placeholder}
      />
    );
  }
  return (
    <View>
      <Text className="text-sm font-sans-semibold text-kumo-subtle mb-2">
        {label}
      </Text>
      <TextInput
        className="h-12 border border-kumo-line rounded-md px-4 text-base font-sans text-kumo-default"
        placeholder={placeholder}
        placeholderTextColor={Colors.gray[400]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
      />
    </View>
  );
}

function CategoryQuickAdd({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await createCategory({ name: name.trim() });
      setName("");
      onCreated();
    } catch {
      Alert.alert("Gagal", "Gagal membuat kategori");
    } finally {
      setAdding(false);
    }
  };

  return (
    <View className="flex-row gap-3">
      <TextInput
        className="flex-1 h-12 border border-kumo-line rounded-md px-4 text-base font-sans text-kumo-default"
        placeholder="Nama kategori (contoh: Makanan)"
        placeholderTextColor={Colors.gray[400]}
        value={name}
        onChangeText={setName}
      />
      <Pressable
        className={`h-12 rounded-md items-center justify-center px-6 ${
          adding ? "bg-kumo-brand" : "bg-kumo-brand"
        }`}
        onPress={handleAdd}
        disabled={adding || !name.trim()}
      >
        <Text className="text-sm font-sans-semibold text-kumo-inverse">
          {adding ? "..." : "Tambah"}
        </Text>
      </Pressable>
    </View>
  );
}
