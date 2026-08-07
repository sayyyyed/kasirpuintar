import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_KEY = "cart_items_v1";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  cogs: number;
  qty: number;
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((saved) => {
      if (saved) setItems(JSON.parse(saved));
    });
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
  }, []);

  const addItem = useCallback(
    (product: { id: string; name: string; price: number; cogs?: number }) => {
      setItems((prev) => {
        const ex = prev.find((i) => i.productId === product.id);
        const next = ex
          ? prev.map((i) =>
              i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
            )
          : [
              ...prev,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                cogs: product.cogs ?? product.price,
                qty: 1,
              },
            ];
        AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateQty = useCallback((productId: string, delta: number) => {
    setItems((prev) => {
      const next = prev
        .map((i) =>
          i.productId === productId
            ? { ...i, qty: Math.max(0, i.qty + delta) }
            : i
        )
        .filter((i) => i.qty > 0);
      AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      AsyncStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    AsyncStorage.removeItem(CART_KEY);
  }, []);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items]
  );
  const count = useMemo(
    () => items.reduce((s, i) => s + i.qty, 0),
    [items]
  );

  return { items, addItem, updateQty, removeItem, clearCart, total, count };
}
