import { useEffect, useState } from "react";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/db";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  price: number;
  cogs: number;
  stock: number;
  image_url?: string;
  active: boolean;
};

export function useProducts(categoryId?: string, searchQuery?: string) {
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    const conditions: any[] = [
      Q.where("deleted_at", Q.eq(null)),
      Q.where("active", Q.eq(true)),
    ];

    if (categoryId) {
      conditions.push(Q.where("category_id", Q.eq(categoryId)));
    }

    if (searchQuery) {
      conditions.push(
        Q.where("name", Q.like(`%${Q.sanitizeLikeString(searchQuery)}%`))
      );
    }

    const query = database.get("products").query(...conditions);

    const sub = query.observe().subscribe((records: any) => {
      setProducts(
        records.filter((r: any) => r.active && !r.deleted_at)
      );
    });

    return () => sub.unsubscribe();
  }, [categoryId, searchQuery]);

  return products;
}
