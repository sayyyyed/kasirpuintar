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
    setIsSaving(true);
    try {
      const input = {
        sku: form.sku.trim() || form.name.trim().slice(0, 3).toUpperCase(),
        name: form.name.trim(),
        price: Number(form.price) || 0,
        cogs: Number(form.cogs) || 0,
        categoryId: form.categoryId || "uncategorized",
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-2 flex-row items-end justify-between">
        <View>
          <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
            Menu
          </Text>
          <Text
            className="text-2xl font-sans-extrabold text-foreground mt-1"
            style={{ letterSpacing: -0.5 }}
          >
            Produk
          </Text>
        </View>
        <Pressable
          className="bg-primary rounded-md px-4 py-3 flex-row items-center"
          onPress={openCreate}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-sm font-sans-bold text-white ml-2">Tambah</Text>
        </Pressable>
      </View>

      <View className="px-6 py-4 flex-row gap-3">
        <View className="flex-1 bg-primary-50 rounded-lg p-4">
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mb-2">
            <Package size={18} color={Colors.primary.DEFAULT} strokeWidth={2.5} />
          </View>
          <Text className="text-xl font-sans-extrabold text-foreground">
            {totalProducts}
          </Text>
          <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">
            Menu
          </Text>
        </View>
        <View className="flex-1 bg-secondary-50 rounded-lg p-4">
          <View className="w-10 h-10 rounded-full bg-secondary-100 items-center justify-center mb-2">
            <LayoutGrid size={18} color={Colors.secondary.DEFAULT} strokeWidth={2.5} />
          </View>
          <Text className="text-xl font-sans-extrabold text-foreground">
            {totalCategories}
          </Text>
          <Text className="text-xs font-sans-semibold text-gray-500 uppercase tracking-wider mt-1">
            Kategori
          </Text>
        </View>
      </View>

      <View className="px-6 pb-2">
        <View className="flex-row items-center bg-muted rounded-md px-4">
          <Search size={18} color={Colors.gray[400]} strokeWidth={2} />
          <TextInput
            className="flex-1 h-12 ml-3 text-base text-foreground font-sans"
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
                  isActive ? "bg-primary" : "bg-muted"
                }`}
                style={{ minWidth: 64 }}
                onPress={() => setActiveCat(cat)}
              >
                <Text
                  className={`text-sm font-sans-semibold text-center ${
                    isActive ? "text-white" : "text-gray-600"
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
          <Text className="text-base font-sans-medium text-gray-400 mt-3">
            Belum ada produk
          </Text>
          <Text className="text-sm font-sans text-gray-400 mt-1">
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
              <View className="flex-row items-center py-4 border-b-2 border-muted">
                <Pressable className="flex-row flex-1 items-center" onPress={() => openEdit(item)}>
                  <View
                    className="w-14 h-14 rounded-lg items-center justify-center bg-muted"
                  >
                    <Text className="text-xl">📦</Text>
                  </View>

                  <View className="ml-4 flex-1">
                    <Text className="text-base font-sans-bold text-foreground">
                      {item.name}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500 mt-0.5">
                      SKU: {item.sku || "-"}
                    </Text>
                    <View className="flex-row items-center mt-1 gap-3">
                      <Text className="text-xs font-sans-medium text-primary">
                        {fmt(item.price || 0)}
                      </Text>
                      <Text className="text-xs font-sans text-gray-400">
                        COGS: {fmt(item.cogs || 0)}
                      </Text>
                      {marginPct > 0 && (
                        <Text className="text-xs font-sans-semibold text-secondary">
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
              label="Harga Jual (Rp)"
              value={form.price}
              onChangeText={(v) => setForm({ ...form, price: v })}
              placeholder="15000"
              keyboardType="numeric"
            />
            <Field
              label="Harga Pokok / COGS (Rp)"
              value={form.cogs}
              onChangeText={(v) => setForm({ ...form, cogs: v })}
              placeholder="8000"
              keyboardType="numeric"
            />

            <View>
              <Text className="text-sm font-sans-semibold text-gray-500 mb-2">
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
                      form.categoryId === c.id ? "bg-primary" : "bg-muted"
                    }`}
                    onPress={() =>
                      setForm({ ...form, categoryId: c.id })
                    }
                  >
                    <Text
                      className={`text-sm font-sans-semibold ${
                        form.categoryId === c.id
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
                {categories.length === 0 && (
                  <Text className="text-sm text-gray-400">
                    Belum ada kategori. Buat dulu di bawah.
                  </Text>
                )}
              </ScrollView>
            </View>

            <Pressable
              className={`h-14 rounded-md items-center justify-center mt-2 ${
                isSaving ? "bg-primary-600" : "bg-primary"
              }`}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text className="text-lg font-sans-bold text-white">
                {isSaving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
              </Text>
            </Pressable>

            <View className="h-0.5 bg-muted my-4" />

            <Text className="text-sm font-sans-semibold text-gray-400 uppercase tracking-wider">
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
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View>
      <Text className="text-sm font-sans-semibold text-gray-500 mb-2">
        {label}
      </Text>
      <TextInput
        className="h-12 border-2 border-muted rounded-md px-4 text-base font-sans text-foreground"
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
        className="flex-1 h-12 border-2 border-muted rounded-md px-4 text-base font-sans text-foreground"
        placeholder="Nama kategori (contoh: Makanan)"
        placeholderTextColor={Colors.gray[400]}
        value={name}
        onChangeText={setName}
      />
      <Pressable
        className={`h-12 rounded-md items-center justify-center px-6 ${
          adding ? "bg-primary-600" : "bg-primary"
        }`}
        onPress={handleAdd}
        disabled={adding || !name.trim()}
      >
        <Text className="text-sm font-sans-bold text-white">
          {adding ? "..." : "Tambah"}
        </Text>
      </Pressable>
    </View>
  );
}
