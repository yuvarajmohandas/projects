import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import type { Product } from '../types';

export function CartPage() {
  const { items, updateQty, removeFromCart, subtotal, syncProductStock } = useCart();
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);

  // Re-check current stock for everything in the basket (it may have changed
  // since items were added, e.g. someone else bought the last units).
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      items.map((item) =>
        api
          .get<{ product: Product }>(`/products/${item.product.id}`)
          .then((res) => res.product)
          .catch(() => null)
      )
    ).then((freshProducts) => {
      if (cancelled) return;
      const warnings: string[] = [];
      freshProducts.forEach((product) => {
        if (!product) return;
        const previousQty = syncProductStock(product);
        if (previousQty !== null) {
          warnings.push(
            product.stockQty > 0
              ? `${product.name}: only ${product.stockQty} left, reduced from ${previousQty} in your basket.`
              : `${product.name} is now out of stock and was removed from your basket.`
          );
        }
      });
      if (warnings.length > 0) setStockWarnings(warnings);
    });
    return () => {
      cancelled = true;
    };
    // Only re-check on mount — re-running this whenever `items` changes (which
    // syncProductStock itself causes) would create a refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-3">🧺</p>
        <p className="text-gray-500 mb-4">Your basket is empty.</p>
        <Link
          to="/"
          className="inline-block bg-bb-green hover:bg-bb-green-dark text-white font-bold text-sm px-5 py-2.5 rounded-full transition"
        >
          Browse groceries →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-extrabold mb-4 text-gray-900">Your Basket</h2>
      {stockWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 mb-4 space-y-1">
          {stockWarnings.map((w) => (
            <p key={w}>⚠️ {w}</p>
          ))}
        </div>
      )}
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.product.id} className="py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 flex items-center justify-center rounded-lg bg-bb-bg text-2xl shrink-0">
                {item.product.imageEmoji}
              </span>
              <div>
                <p className="font-semibold text-sm text-gray-900">{item.product.name}</p>
                <p className="text-xs text-gray-400">€{item.product.price.toFixed(2)} / {item.product.unit}</p>
                {item.qty >= item.product.stockQty && (
                  <p className="text-xs text-amber-600">Max available: {item.product.stockQty}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-bb-green rounded-full text-white text-sm font-bold shadow-sm">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() =>
                    item.qty <= 1 ? removeFromCart(item.product.id) : updateQty(item.product.id, item.qty - 1)
                  }
                  className="w-7 h-7 flex items-center justify-center"
                >
                  −
                </button>
                <span className="min-w-[1.25rem] text-center">{item.qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={item.qty >= item.product.stockQty}
                  onClick={() => updateQty(item.product.id, item.qty + 1)}
                  className="w-7 h-7 flex items-center justify-center disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <span className="w-16 text-right text-sm font-bold text-gray-900">
                €{(item.product.price * item.qty).toFixed(2)}
              </span>
              <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 text-xs font-medium">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
        <span className="font-extrabold text-lg text-gray-900">Subtotal: €{subtotal.toFixed(2)}</span>
        <Link
          to="/checkout"
          className="bg-bb-green hover:bg-bb-green-dark text-white font-bold py-3 px-6 rounded-full text-sm shadow-sm transition"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
