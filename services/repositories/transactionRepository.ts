import { database } from "@/db";
import * as Crypto from "expo-crypto";
import { enqueueMutation } from "./helpers";
import { sanitizeCurrency } from "@/utils/currency";

export type CartItem = {
  productId: string;
  productName: string;
  price: number;
  cogs: number;
  qty: number;
};

export type TransactionInput = {
  shiftId: string;
  userId: string;
  items: CartItem[];
  paymentMethod: "cash" | "qris" | "transfer";
  paid: number;
  discount?: number;
};

export async function createTransaction(input: TransactionInput) {
  const id = Crypto.randomUUID();
  const now = Date.now();
  const discount = sanitizeCurrency(input.discount ?? 0);
  const paid = sanitizeCurrency(input.paid);
  const items = input.items.map((item) => ({
    ...item,
    price: sanitizeCurrency(item.price),
    cogs: sanitizeCurrency(item.cogs),
    qty: Math.max(0, Math.round(item.qty)),
  }));

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const total = subtotal - discount;

  const transactionPayload: Record<string, unknown> = {
    id,
    shift_id: input.shiftId,
    user_id: input.userId,
    subtotal,
    discount,
    total,
    payment_method: input.paymentMethod,
    paid,
    change: paid - total,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const outbox: {
    table: string;
    id: string;
    payload: Record<string, unknown>;
  }[] = [];

  await database.write(async () => {
    await database.get("transactions").create((t: any) => {
      t._raw.id = id;
      Object.assign(t._raw, transactionPayload);
    });

    for (const item of items) {
      const itemId = Crypto.randomUUID();
      const itemSubtotal = item.price * item.qty;

      const itemPayload: Record<string, unknown> = {
        id: itemId,
        transaction_id: id,
        product_id: item.productId,
        product_name: item.productName,
        price: item.price,
        cogs: item.cogs,
        qty: item.qty,
        subtotal: itemSubtotal,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };

      await database.get("transaction_items").create((ti: any) => {
        Object.assign(ti._raw, itemPayload);
      });
      outbox.push({ table: "transaction_items", id: itemId, payload: itemPayload });
    }
  });

  for (const m of outbox) {
    await enqueueMutation(m.table, m.id, "upsert", m.payload);
  }
  await enqueueMutation("transactions", id, "upsert", transactionPayload);
  return id;
}

export async function getTransactionsByShift(shiftId: string) {
  const { Q } = await import("@nozbe/watermelondb");
  return database
    .get("transactions")
    .query(Q.where("shift_id", Q.eq(shiftId)))
    .fetch();
}

export async function getTransactionsByUser(userId: string) {
  const { Q } = await import("@nozbe/watermelondb");
  return database
    .get("transactions")
    .query(Q.where("user_id", Q.eq(userId)))
    .fetch();
}

export async function getTransactionItems(transactionId: string) {
  const { Q } = await import("@nozbe/watermelondb");
  return database
    .get("transaction_items")
    .query(Q.where("transaction_id", Q.eq(transactionId)))
    .fetch();
}
