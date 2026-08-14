import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState, AppStateStatus } from "react-native";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/db";
import { supabase } from "./supabase";
import { ensureSession } from "./supabase";

const WATERMARK_KEY = "sync_last_pulled_at";

const SYNC_TABLES = [
  "users",
  "categories",
  "products",
  "shifts",
  "transactions",
  "transaction_items",
  "stock_movements",
  "expenses",
  "payroll_periods",
];

const dateFields = new Set([
  "created_at",
  "updated_at",
  "deleted_at",
  "clock_in_at",
  "clock_out_at",
  "period_start",
  "period_end",
  "paid_at",
]);

let isSyncing = false;

function convertDatesToISO(rec: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...rec };
  for (const key of Object.keys(out)) {
    if (dateFields.has(key) && out[key] !== null && out[key] !== undefined) {
      const val = out[key];
      if (typeof val === "number") {
        out[key] = new Date(val).toISOString();
      }
    }
  }
  return out;
}

const MAX_ATTEMPTS = 10;

export async function pushChanges() {
  await ensureSession();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("[sync] push dibatalkan: tidak ada sesi. Pastikan anonymous sign-in diaktifkan di Supabase.");
    return;
  }

  const outboxItems = await database
    .get("sync_outbox")
    .query()
    .fetch();

  if (outboxItems.length === 0) return;

  let failed = 0;

  for (const row of outboxItems) {
    const item = row as any;
    const attempts = (item.attempts ?? 0) + 1;

    if (attempts > MAX_ATTEMPTS) {
      console.warn(`[sync] drop stale ${item.tableName}/${item.recordId} setelah ${MAX_ATTEMPTS}x gagal`);
      await database.write(async () => {
        await item.destroyPermanently();
      });
      continue;
    }

    try {
      const raw = JSON.parse(item.payload as string) as Record<string, unknown>;
      const rec = convertDatesToISO(raw);
      const { error } = await supabase
        .from(item.tableName as string)
        .upsert(rec, { onConflict: "id" });

      if (!error) {
        await database.write(async () => {
          await item.destroyPermanently();
        });
      } else {
        failed += 1;
        console.warn(`[sync] push ${item.tableName}/${item.recordId} gagal:`, error.message);
        await database.write(async () => {
          await item.update((r: any) => {
            r.attempts = attempts;
          });
        });
      }
    } catch (err) {
      failed += 1;
      console.warn(`[sync] push ${item.tableName}/${item.recordId} error:`, err);
      await database.write(async () => {
        await item.update((r: any) => {
          r.attempts = attempts;
        });
      });
    }
  }

  return failed;
}

export async function pullChanges() {
  await ensureSession();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("[sync] pull dibatalkan: tidak ada sesi. Pastikan anonymous sign-in diaktifkan di Supabase.");
    return;
  }
  const lastPulled =
    (await AsyncStorage.getItem(WATERMARK_KEY)) || new Date(0).toISOString();
  let newest = lastPulled;

  for (const tableName of SYNC_TABLES) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .gt("updated_at", lastPulled)
      .order("updated_at", { ascending: true })
      .limit(500);

    if (error) {
      console.warn(`[sync] pull ${tableName} gagal:`, error.message);
      continue;
    }
    if (!data?.length) continue;

    const collection = database.get(tableName);

    await database.write(async () => {
      for (const rawRow of data) {
        const row = rawRow as Record<string, unknown>;
        const records = await collection
          .query(Q.where("id", Q.eq(row.id as string)))
          .fetch();
        const local = records[0];

        if (row.deleted_at && local) {
          await local.destroyPermanently();
          continue;
        }

        if (!local) {
          await collection.create((r: any) => {
            r._raw.id = row.id;
            applyRowData(r._raw, row);
          });
        } else {
          const serverTs = new Date(row.updated_at as string).getTime();
          const localTs = (local as any).updatedAt?.getTime?.() ?? 0;
          if (serverTs > localTs) {
            await local.update((r: any) => {
              applyRowData(r._raw, row);
            });
          }
        }

        if (!row.deleted_at && (row.updated_at as string) > newest) {
          newest = row.updated_at as string;
        }
      }
    });
  }

  await AsyncStorage.setItem(WATERMARK_KEY, newest);
}

export async function syncAll() {
  const failed = await pushChanges();
  await pullChanges();
  return failed ?? 0;
}

let netUnsub: (() => void) | null = null;
let appStateSub: { remove: () => void } | null = null;

export function startAutoSync() {
  netUnsub = NetInfo.addEventListener((state) => {
    if (state.isConnected && !isSyncing) {
      isSyncing = true;
      syncAll().finally(() => {
        isSyncing = false;
      });
    }
  });

  appStateSub = AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active" && !isSyncing) {
      isSyncing = true;
      syncAll().finally(() => {
        isSyncing = false;
      });
    }
  });
}

export function stopAutoSync() {
  netUnsub?.();
  appStateSub?.remove();
  netUnsub = null;
  appStateSub = null;
}

function applyRowData(
  target: any,
  row: Record<string, unknown>
) {
  for (const key of Object.keys(row)) {
    if (key === "id") continue;
    const value = row[key];
    if (dateFields.has(key)) {
      target[key] = value
        ? new Date(value as string).getTime()
        : null;
    } else {
      target[key] = value;
    }
  }
}
