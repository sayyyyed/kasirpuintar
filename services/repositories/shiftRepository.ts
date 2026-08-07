import { database } from "@/db";
import { Q } from "@nozbe/watermelondb";
import * as Crypto from "expo-crypto";
import { enqueueMutation } from "./helpers";

export type ShiftInput = {
  userId: string;
  openingCash: number;
};

export async function clockIn(input: ShiftInput) {
  const id = Crypto.randomUUID();
  const now = Date.now();

  const payload: Record<string, unknown> = {
    id,
    user_id: input.userId,
    clock_in_at: now,
    clock_out_at: null,
    opening_cash: input.openingCash,
    closing_cash: null,
    sales_total: 0,
    expense_total: 0,
    status: "open",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await database.write(async () => {
    await database.get("shifts").create((s: any) => {
      s._raw.id = id;
      Object.assign(s._raw, payload);
    });
  });

  await enqueueMutation("shifts", id, "upsert", payload);
  return id;
}

export async function clockOut(shiftId: string, closingCash: number) {
  const shift = await database.get("shifts").find(shiftId);
  const now = Date.now();

  const updates: Record<string, unknown> = {
    clock_out_at: now,
    closing_cash: closingCash,
    status: "closed",
    updated_at: now,
  };

  await database.write(async () => {
    await shift.update((s: any) => {
      Object.assign(s._raw, updates);
    });
  });

  await enqueueMutation("shifts", shiftId, "upsert", {
    ...(shift as any)._raw,
    ...updates,
  });
}

export async function updateShiftTotals(shiftId: string) {
  const txns = await database
    .get("transactions")
    .query(Q.where("shift_id", Q.eq(shiftId)))
    .fetch();

  const expenses = await database
    .get("expenses")
    .query(Q.where("shift_id", Q.eq(shiftId)))
    .fetch();

  const salesTotal = txns.reduce(
    (sum: number, t: any) => sum + t.total,
    0
  );
  const expenseTotal = expenses.reduce(
    (sum: number, e: any) => sum + e.amount,
    0
  );

  const shift = await database.get("shifts").find(shiftId);
  const now = Date.now();

  await database.write(async () => {
    await shift.update((s: any) => {
      Object.assign(s._raw, {
        sales_total: salesTotal,
        expense_total: expenseTotal,
        updated_at: now,
      });
    });
  });

  await enqueueMutation("shifts", shiftId, "upsert", {
    sales_total: salesTotal,
    expense_total: expenseTotal,
    updated_at: now,
  });
}

export async function getOpenShift(userId: string) {
  const shifts = await database
    .get("shifts")
    .query(
      Q.where("user_id", Q.eq(userId)),
      Q.where("status", Q.eq("open"))
    )
    .fetch();
  return shifts[0] || null;
}

export async function getShiftsByUser(userId: string) {
  return database
    .get("shifts")
    .query(Q.where("user_id", Q.eq(userId)))
    .fetch();
}
