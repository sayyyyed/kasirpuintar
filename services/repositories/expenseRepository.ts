import { database } from "@/db";
import { Q } from "@nozbe/watermelondb";
import * as Crypto from "expo-crypto";
import { enqueueMutation } from "./helpers";
import type { ExpenseType } from "@/db/models";

export type ExpenseEntryInput = {
  shiftId: string;
  userId: string;
  name: string;
  category: string;
  amount: number;
  type: ExpenseType;
  note?: string;
};

export async function createExpenseEntry(input: ExpenseEntryInput) {
  const id = Crypto.randomUUID();
  const now = Date.now();

  const payload: Record<string, unknown> = {
    id,
    shift_id: input.shiftId,
    user_id: input.userId,
    name: input.name,
    category: input.category,
    type: input.type,
    amount: input.amount,
    note: input.note ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await database.write(async () => {
    await database.get("expenses").create((e: any) => {
      e._raw.id = id;
      Object.assign(e._raw, payload);
    });
  });

  await enqueueMutation("expenses", id, "upsert", payload);
  return id;
}

export async function getExpensesByShift(shiftId: string) {
  return database
    .get("expenses")
    .query(
      Q.where("shift_id", Q.eq(shiftId)),
      Q.where("deleted_at", Q.eq(null))
    )
    .fetch();
}

export async function deleteExpenseEntry(id: string) {
  const now = Date.now();

  await database.write(async () => {
    const entry = await database.get("expenses").find(id);
    await entry.update((e: any) => {
      e.deleted_at = now;
      e.updated_at = now;
    });
  });

  await enqueueMutation("expenses", id, "upsert", {
    deleted_at: now,
    updated_at: now,
  });
}
