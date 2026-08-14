import { useEffect, useState } from "react";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/db";

export function useCategories() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const sub = database
      .get("categories")
      .query(Q.where("deleted_at", Q.eq(null)))
      .observe()
      .subscribe((records: any[]) => {
        setCategories(
          records.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        );
      });
    return () => sub.unsubscribe();
  }, []);

  return categories;
}
