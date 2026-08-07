import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState, AppStateStatus } from "react-native";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/db";
import { supabase } from "./supabase";

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
];

const dateFields = new Set(["created_at", "updated_at", "deleted_at"]);

let isSyncing = false;

export async function pushChanges() {
  const outboxItems = await database
    .get("sync_outbox")
    .query()
    .fetch();

  for (const row of outboxItems) {
    const item = row as any;
    try {
      const rec = JSON.parse(item.payload as string) as Record<string, unknown>;
      const { error } = await supabase
        .from(item.tableName as string)
        .upsert(rec, { onConflict: "id" });

      if (!error) {
        await database.write(async () => {
          await item.destroyPermanently();
        });
      } else {
        await database.write(async () => {
          await item.update((r: any) => {
            r.attempts = r.attempts + 1;
          });
        });
      }
    } catch {
      await database.write(async () => {
        await item.update((r: any) => {
          r.attempts = r.attempts + 1;
        });
      });
    }
  }
}

export async function pullChanges() {
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

    if (error || !data?.length) continue;

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
            applyRowData(r, row);
          });
        } else {
          const serverTs = new Date(row.updated_at as string).getTime();
          const localTs = (local as any).updatedAt?.getTime?.() ?? 0;
          if (serverTs > localTs) {
            await local.update((r: any) => {
              applyRowData(r, row);
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
  await pushChanges();
  await pullChanges();
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
        : undefined;
    } else {
      target[key] = value;
    }
  }
}
