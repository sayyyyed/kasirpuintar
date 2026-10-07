import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { AppState, AppStateStatus } from "react-native";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/db";
import { supabase } from "./supabase";

const WATERMARK_KEY = "sync_last_pulled_at";
const OFFLINE_MODE_KEY = "sync_offline_mode";
const AUTO_SYNC_KEY = "sync_auto_enabled";

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

// Mengubah nilai tanggal (ISO string/number) menjadi epoch ms. Mengembalikan
// null untuk nilai kosong atau tidak valid (mis. epoch 0 dari data lama) supaya
// tidak salah dianggap sebagai record terhapus.
function toEpoch(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const ts = new Date(value as string).getTime();
  return Number.isFinite(ts) && ts > 0 ? ts : null;
}

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
let settingsLoaded = false;
let offlineMode = false;
let autoSyncEnabled = true;
let networkOnline = true;

// Gabungkan perubahan beruntun (mis. 1 transaksi + banyak item) jadi satu
// batch push, bukan push terpisah-pisah.
const PUSH_DEBOUNCE_MS = 1500;
// Tarik perubahan dari server secara berkala selama online.
const PULL_INTERVAL_MS = 30000;

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pullTimer: ReturnType<typeof setInterval> | null = null;

export async function loadSyncSettings() {
  if (settingsLoaded) return;

  const [storedOfflineMode, storedAutoSync] = await Promise.all([
    AsyncStorage.getItem(OFFLINE_MODE_KEY),
    AsyncStorage.getItem(AUTO_SYNC_KEY),
  ]);

  offlineMode = storedOfflineMode === "true";
  autoSyncEnabled = storedAutoSync !== "false";
  settingsLoaded = true;
}

export async function getSyncSettings() {
  await loadSyncSettings();
  return { offlineMode, autoSync: autoSyncEnabled };
}

export async function setOfflineModeEnabled(value: boolean) {
  await loadSyncSettings();
  offlineMode = value;
  await AsyncStorage.setItem(OFFLINE_MODE_KEY, String(value));
}

export async function setAutoSyncEnabled(value: boolean) {
  await loadSyncSettings();
  autoSyncEnabled = value;
  await AsyncStorage.setItem(AUTO_SYNC_KEY, String(value));
}

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
  await loadSyncSettings();
  if (offlineMode) return 0;

  const outboxItems = await database
    .get("sync_outbox")
    .query()
    .fetch();

  if (outboxItems.length === 0) return 0;

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
  await loadSyncSettings();
  if (offlineMode) return 0;

  let failed = 0;

  for (const tableName of SYNC_TABLES) {
    // Each table needs its own watermark. A single global watermark can cause
    // older rows in `users` to be skipped when another table was updated later.
    const tableWatermarkKey = `${WATERMARK_KEY}_${tableName}`;
    const lastPulled =
      (await AsyncStorage.getItem(tableWatermarkKey)) ||
      new Date(0).toISOString();
    let newest = lastPulled;

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .gt("updated_at", lastPulled)
      .order("updated_at", { ascending: true })
      .limit(500);

    if (error) {
      failed += 1;
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

        if (toEpoch(row.deleted_at) !== null && local) {
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

        if ((row.updated_at as string) > newest) {
          newest = row.updated_at as string;
        }
      }
    });

    await AsyncStorage.setItem(tableWatermarkKey, newest);
  }

  // Keep the legacy key for compatibility with older app versions. New syncs
  // use the per-table keys above.
  await AsyncStorage.setItem(WATERMARK_KEY, new Date().toISOString());
  return failed;
}

/**
 * Sync dua arah dengan rincian kegagalan per arah.
 * `pushFailed` = perubahan lokal yang belum terkirim (tidak fatal).
 * `pullFailed` = data server yang gagal diunduh (fatal untuk kelengkapan data).
 */
export async function syncAllDetailed() {
  await loadSyncSettings();
  if (offlineMode) return { pushFailed: 0, pullFailed: 0 };

  const pushFailed = await pushChanges();
  const pullFailed = await pullChanges();
  return { pushFailed: pushFailed ?? 0, pullFailed: pullFailed ?? 0 };
}

export async function syncAll() {
  const { pushFailed, pullFailed } = await syncAllDetailed();
  return pushFailed + pullFailed;
}

let netUnsub: (() => void) | null = null;
let appStateSub: { remove: () => void } | null = null;

/**
 * Jalankan task sync dengan guard single-flight + mode offline.
 * Mengembalikan `true` bila task benar-benar dijalankan.
 */
async function runGuarded(task: () => Promise<number>): Promise<boolean> {
  await loadSyncSettings();
  if (offlineMode || isSyncing) return false;
  isSyncing = true;
  try {
    await task();
  } catch {
    // best-effort: kegagalan ditangani di dalam task
  } finally {
    isSyncing = false;
  }
  return true;
}

/**
 * Dijadwalkan setiap ada mutasi lokal. Menunda push sebentar agar perubahan
 * beruntun tergabung jadi satu batch, lalu mengosongkan outbox saat online.
 * Saat offline, cukup diamkan — outbox akan terkirim saat kembali online.
 */
export function schedulePush() {
  if (offlineMode) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    pushTimer = null;
    const ran = await runGuarded(pushChanges);
    // Sedang ada sync lain berjalan — coba lagi supaya outbox tidak tertinggal.
    if (!ran && !offlineMode) schedulePush();
  }, PUSH_DEBOUNCE_MS);
}

export function startAutoSync() {
  if (offlineMode || !autoSyncEnabled) return;
  if (netUnsub || pullTimer) return;

  netUnsub = NetInfo.addEventListener((state) => {
    networkOnline = !!state.isConnected;
    if (networkOnline && !offlineMode && autoSyncEnabled) {
      runGuarded(syncAll);
    }
  });

  appStateSub = AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active" && !offlineMode && autoSyncEnabled) {
      runGuarded(syncAll);
    }
  });

  pullTimer = setInterval(() => {
    if (networkOnline && !offlineMode && autoSyncEnabled) {
      // push+pull sekaligus: sekaligus retry outbox yang sempat gagal.
      runGuarded(syncAll);
    }
  }, PULL_INTERVAL_MS);
}

export function stopAutoSync() {
  netUnsub?.();
  appStateSub?.remove();
  netUnsub = null;
  appStateSub = null;
  if (pullTimer) {
    clearInterval(pullTimer);
    pullTimer = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

function applyRowData(
  target: any,
  row: Record<string, unknown>
) {
  for (const key of Object.keys(row)) {
    if (key === "id") continue;
    const value = row[key];
    if (dateFields.has(key)) {
      target[key] = toEpoch(value);
    } else {
      target[key] = value;
    }
  }
}
