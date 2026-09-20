import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { CartItem, Product } from '../types';

interface CartContextValue {
  items: CartItem[];
  /** Returns the quantity actually added, which may be less than requested (or 0) if stock is limited. */
  addToCart: (product: Product, qty?: number) => number;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  getCartQty: (productId: string) => number;
  /**
   * Refreshes a cart line with the latest product data (e.g. after re-fetching
   * from the server) and clamps its quantity down if stock has since dropped.
   * Returns the previous quantity if it had to be reduced, otherwise null.
   */
  syncProductStock: (product: Product) => number | null;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'foodindustry_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Returns how many units were actually added (0 if already at/over stock).
  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      const existing = items.find((i) => i.product.id === product.id);
      const currentQty = existing?.qty ?? 0;
      const availableToAdd = Math.max(product.stockQty - currentQty, 0);
      const amountToAdd = Math.min(qty, availableToAdd);
      if (amountToAdd <= 0) return 0;

      setItems((prev) => {
        const match = prev.find((i) => i.product.id === product.id);
        if (match) {
          // Refresh the stored product snapshot (price/stock may have changed) as we update quantity.
          return prev.map((i) => (i.product.id === product.id ? { product, qty: i.qty + amountToAdd } : i));
        }
        return [...prev, { product, qty: amountToAdd }];
      });
      return amountToAdd;
    },
    [items]
  );

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, qty: Math.min(qty, i.product.stockQty) } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  const getCartQty = useCallback(
    (productId: string) => items.find((i) => i.product.id === productId)?.qty ?? 0,
    [items]
  );

  const syncProductStock = useCallback(
    (product: Product) => {
      const existing = items.find((i) => i.product.id === product.id);
      if (!existing) return null;
      const wasReduced = product.stockQty < existing.qty;

      setItems((prev) =>
        prev
          .map((i) => (i.product.id === product.id ? { product, qty: Math.min(i.qty, product.stockQty) } : i))
          .filter((i) => i.qty > 0)
      );

      return wasReduced ? existing.qty : null;
    },
    [items]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.product.price * i.qty, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQty, clearCart, getCartQty, syncProductStock, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
