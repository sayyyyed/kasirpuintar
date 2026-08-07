import { database } from "@/db";
import { Q } from "@nozbe/watermelondb";
import * as Crypto from "expo-crypto";
import { enqueueMutation } from "./helpers";

export type ProductInput = {
  sku: string;
  barcode?: string;
  name: string;
  categoryId: string;
  price: number;
  cogs: number;
  imageUrl?: string;
};

export async function createProduct(input: ProductInput) {
  const id = Crypto.randomUUID();
  const now = Date.now();

  const payload: Record<string, unknown> = {
    id,
    sku: input.sku,
    barcode: input.barcode ?? null,
    name: input.name,
    category_id: input.categoryId,
    price: input.price,
    cogs: input.cogs,
    stock: 0,
    image_url: input.imageUrl ?? null,
    active: true,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await database.write(async () => {
    await database.get("products").create((p: any) => {
      p._raw.id = id;
      Object.assign(p._raw, payload);
    });
  });

  await enqueueMutation("products", id, "upsert", payload);
  return id;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
) {
  const product = await database.get("products").find(id);
  const now = Date.now();

  const updates: Record<string, unknown> = { updated_at: now };
  if (input.sku !== undefined) updates.sku = input.sku;
  if (input.barcode !== undefined) updates.barcode = input.barcode;
  if (input.name !== undefined) updates.name = input.name;
  if (input.categoryId !== undefined) updates.category_id = input.categoryId;
  if (input.price !== undefined) updates.price = input.price;
  if (input.cogs !== undefined) updates.cogs = input.cogs;
  if (input.imageUrl !== undefined) updates.image_url = input.imageUrl;

  await database.write(async () => {
    await product.update((p: any) => {
      Object.assign(p._raw, updates);
    });
  });

  await enqueueMutation("products", id, "upsert", {
    ...(product as any)._raw,
    ...updates,
  });
}

export async function deleteProduct(id: string) {
  const now = Date.now();

  await database.write(async () => {
    const product = await database.get("products").find(id);
    await product.update((p: any) => {
      p.deleted_at = now;
      p.updated_at = now;
      p.active = false;
    });
  });

  await enqueueMutation("products", id, "upsert", {
    deleted_at: now,
    updated_at: now,
    active: false,
  });
}

export async function getProductsByCategory(categoryId: string) {
  const records = await database
    .get("products")
    .query(
      Q.where("category_id", Q.eq(categoryId)),
      Q.where("deleted_at", Q.eq(null)),
      Q.where("active", Q.eq(true))
    )
    .fetch();
  return records;
}

export async function searchProducts(query: string) {
  const records = await database
    .get("products")
    .query(
      Q.where("name", Q.like(`%${Q.sanitizeLikeString(query)}%`)),
      Q.where("deleted_at", Q.eq(null)),
      Q.where("active", Q.eq(true))
    )
    .fetch();
  return records;
}
