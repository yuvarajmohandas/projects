import { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { ProductCard } from '../components/ProductCard';
import type { Category, Product } from '../types';

export function OffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ categories: Category[] }>('/categories').then((res) => setCategories(res.categories)).catch(() => undefined);
    
    setLoading(true);
    api.get<{ products: Product[] }>('/products')
      .then((res) => setProducts(res.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categoryLabel = useMemo(
    () => (id: string) => categories.find((c) => c.id === id)?.name ?? '',
    [categories]
  );

  // Filter out ONLY items running an active discount
  const discountProducts = useMemo(() => {
    return products.filter(p => p.oldPrice && p.oldPrice > p.price);
  }, [products]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <span className="w-8 h-8 border-4 border-bb-green border-t-transparent rounded-full animate-spin"></span>
        <p className="text-sm font-semibold tracking-wide">Hunting down the best deals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Promotional Deals Landing Banner Block */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">💥 Mega Savings Zone</h2>
        <p className="mt-1 text-sm opacity-90 max-w-xl font-medium">Up to 40% off on daily grocery items, fresh produce, and pantry staples. Grab them before stock runs out!</p>
      </div>

      <div className="border-b border-gray-100 pb-2">
        <h3 className="text-xl font-black text-gray-900 tracking-tight">All Discounted Offers ({discountProducts.length})</h3>
      </div>

      {discountProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <span className="text-4xl">🏷️</span>
          <p className="text-gray-400 font-bold mt-3 text-sm">No special deals are active today. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {discountProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              categoryName={categoryLabel(product.categoryId)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
