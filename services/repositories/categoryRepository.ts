import { database } from "@/db";
import { Q } from "@nozbe/watermelondb";
import * as Crypto from "expo-crypto";
import { enqueueMutation } from "./helpers";

export type CategoryInput = {
  name: string;
  sortOrder?: number;
};

export async function createCategory(input: CategoryInput) {
  const id = Crypto.randomUUID();
  const now = Date.now();

  const payload: Record<string, unknown> = {
    id,
    name: input.name,
    sort_order: input.sortOrder ?? 0,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await database.write(async () => {
    await database.get("categories").create((c: any) => {
      c._raw.id = id;
      Object.assign(c._raw, payload);
    });
  });

  await enqueueMutation("categories", id, "upsert", payload);
  return id;
}

export async function getAllCategories() {
  return database
    .get("categories")
    .query(Q.where("deleted_at", Q.eq(null)))
    .fetch();
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
) {
  const category = await database.get("categories").find(id);
  const now = Date.now();

  const updates: Record<string, unknown> = { updated_at: now };
  if (input.name !== undefined) updates.name = input.name;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;

  await database.write(async () => {
    await category.update((c: any) => {
      Object.assign(c._raw, updates);
    });
  });

  await enqueueMutation("categories", id, "upsert", {
    id,
    name: (category as any).name,
    sort_order: (category as any).sortOrder,
    created_at: (category as any).createdAt?.getTime?.() ?? null,
    deleted_at: (category as any).deletedAt?.getTime?.() ?? null,
    ...updates,
  });
}

export async function deleteCategory(id: string) {
  const now = Date.now();

  await database.write(async () => {
    const category = await database.get("categories").find(id);
    await category.update((c: any) => {
      c.deleted_at = now;
      c.updated_at = now;
    });
  });

  await enqueueMutation("categories", id, "upsert", {
    deleted_at: now,
    updated_at: now,
  });
}
