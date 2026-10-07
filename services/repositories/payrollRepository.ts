import { database } from "@/db";
import { Q } from "@nozbe/watermelondb";
import * as Crypto from "expo-crypto";
import { enqueueMutation } from "./helpers";
import { sanitizeCurrency } from "@/utils/currency";

export type PayrollInput = {
  userId: string;
  periodStart: number;
  periodEnd: number;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
  note?: string;
};

export async function getEmployeeShifts(
  userId: string,
  start: number,
  end: number
) {
  return database
    .get("shifts")
    .query(
      Q.where("user_id", Q.eq(userId)),
      Q.where("clock_in_at", Q.gte(start)),
      Q.where("clock_in_at", Q.lte(end)),
      Q.where("deleted_at", Q.eq(null))
    )
    .fetch();
}

export async function getPayrollPeriods(
  userId?: string,
  start?: number,
  end?: number
) {
  const conditions: any[] = [];
  if (userId) conditions.push(Q.where("user_id", Q.eq(userId)));
  if (start) conditions.push(Q.where("period_start", Q.gte(start)));
  if (end) conditions.push(Q.where("period_end", Q.lte(end)));
  conditions.push(Q.where("deleted_at", Q.eq(null)));
  return database.get("payroll_periods").query(...conditions).fetch().catch(() => []);
}

export async function createPayrollPeriod(input: PayrollInput) {
  const id = Crypto.randomUUID();
  const now = Date.now();

  const payload: Record<string, unknown> = {
    id,
    user_id: input.userId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    total_hours: input.totalHours,
    hourly_rate: sanitizeCurrency(input.hourlyRate),
    gross_pay: sanitizeCurrency(input.grossPay),
    status: "pending",
    paid_at: null,
    note: input.note ?? null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  await database.write(async () => {
    await database.get("payroll_periods").create((r: any) => {
      r._raw.id = id;
      Object.assign(r._raw, payload);
    });
  });

  await enqueueMutation("payroll_periods", id, "upsert", payload);
  return id;
}

export async function markPayrollPaid(payrollId: string) {
  const record = await database.get("payroll_periods").find(payrollId);
  const now = Date.now();

  await database.write(async () => {
    await record.update((r: any) => {
      Object.assign(r._raw, {
        status: "paid",
        paid_at: now,
        updated_at: now,
      });
    });
  });

  await enqueueMutation("payroll_periods", payrollId, "upsert", {
    id: payrollId,
    status: "paid",
    paid_at: now,
    updated_at: now,
  });
}

export async function updateEmployeeRate(userId: string, hourlyRate: number | null) {
  const user = await database.get("users").find(userId);
  const now = Date.now();

  await database.write(async () => {
    await user.update((u: any) => {
      Object.assign(u._raw, {
        hourly_rate: hourlyRate == null ? null : sanitizeCurrency(hourlyRate),
        updated_at: now,
      });
    });
  });

  await enqueueMutation("users", userId, "upsert", {
    id: userId,
    name: (user as any).name,
    email: (user as any).email,
    role: (user as any).role,
    pin_hash: (user as any).pinHash ?? null,
    hourly_rate: hourlyRate == null ? null : sanitizeCurrency(hourlyRate),
    active: (user as any).active,
    created_at: (user as any).createdAt?.getTime?.() ?? null,
    updated_at: now,
    deleted_at: null,
  });
}
