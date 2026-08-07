import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { database } from "@/db";

const WATERMARK_KEY = "sync_last_pulled_at";

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [outboxPending, setOutboxPending] = useState(0);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });

    AsyncStorage.getItem(WATERMARK_KEY).then((val) => setLastSync(val));

    const interval = setInterval(() => {
      database
        .get("sync_outbox")
        .query()
        .fetchCount()
        .then((count) => setOutboxPending(count));
    }, 3000);

    database
      .get("sync_outbox")
      .query()
      .fetchCount()
      .then((count) => setOutboxPending(count));

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const lastSyncFormatted = lastSync
    ? new Date(lastSync).toLocaleString("id-ID")
    : "Belum pernah";

  return { isOnline, lastSyncFormatted, outboxPending };
}
