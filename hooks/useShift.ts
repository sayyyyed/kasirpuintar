import { useEffect, useMemo, useState } from "react";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/db";

export function useShift(userId: string) {
  const [shift, setShift] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const query = database.get("shifts").query(
      Q.where("user_id", Q.eq(userId)),
      Q.where("status", Q.eq("open"))
    );

    const sub = query.observe().subscribe((records) => {
      setShift(records.length > 0 ? records[0] : null);
    });

    return () => sub.unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!shift?.clock_in_at) return;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - (shift.clock_in_at as number)) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [shift?.clock_in_at]);

  const formattedTime = useMemo(() => {
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [elapsed]);

  return { shift, elapsed, formattedTime };
}
