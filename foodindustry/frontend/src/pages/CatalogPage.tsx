import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import type { Category, HomepageLayout, Product } from '../types';

export function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homepage, setHomepage] = useState<HomepageLayout | null>(null);
  const { addToCart, updateQty, removeFromCart, getCartQty } = useCart();

  useEffect(() => {
    api.get<HomepageLayout>('/homepage').then(setHomepage).catch(() => undefined);
  }, []);

  useEffect(() => {
    api
      .get<{ categories: Category[] }>('/categories')
      .then((res) => setCategories(res.categories))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (search) params.set('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    api
      .get<{ products: Product[] }>(`/products${query}`)
      .then((res) => setProducts(res.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCategory, search]);

  const categoryLabel = useMemo(
    () => (id: string) => categories.find((c) => c.id === id)?.name ?? '',
    [categories]
  );

  function handleIncrement(product: Product) {
    addToCart(product, 1);
  }

  function handleDecrement(product: Product, currentQty: number) {
    if (currentQty <= 1) removeFromCart(product.id);
    else updateQty(product.id, currentQty - 1);
  }

  return (
    <div>
      {homepage?.sections.filter((section) => section.isActive).map((section) => (
        <section key={section.id} className={`mb-6 rounded-2xl overflow-hidden ${section.type === 'spacer' ? 'h-6' : 'bg-white border border-gray-100 shadow-sm'}`}>
          {section.content.imageUrl && <img src={section.content.imageUrl} alt="" className="h-48 w-full object-cover" />}
          {section.type !== 'spacer' && (
            <div className="p-6">
              {section.content.title && <h2 className="text-2xl font-extrabold text-gray-900">{section.content.title}</h2>}
              {section.content.description && <p className="mt-2 text-gray-600">{section.content.description}</p>}
              {section.content.buttonText && section.content.buttonLink && <a href={section.content.buttonLink} className="mt-4 inline-block rounded-full bg-bb-green px-4 py-2 font-bold text-white">{section.content.buttonText}</a>}
            </div>
          )}
        </section>
      ))}
      <h2 className="text-2xl font-extrabold mb-4 text-gray-900">Browse Groceries</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for over 5,000 products"
            className="w-full border border-gray-200 rounded-full pl-10 pr-4 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-bb-green"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
            selectedCategory === ''
              ? 'bg-bb-green text-white border-bb-green'
              : 'bg-white text-gray-600 border-gray-200 hover:border-bb-green hover:text-bb-green-darker'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
              selectedCategory === c.id
                ? 'bg-bb-green text-white border-bb-green'
                : 'bg-white text-gray-600 border-gray-200 hover:border-bb-green hover:text-bb-green-darker'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-gray-400">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-400">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product) => {
            const cartQty = getCartQty(product.id);
            const remaining = product.stockQty - cartQty;
            const atLimit = remaining <= 0;
            const outOfStock = product.stockQty <= 0;
            return (
              <div
                key={product.id}
                className={`relative border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition flex flex-col ${
                  outOfStock ? 'opacity-50' : ''
                }`}
              >
                <div className="relative bg-bb-bg rounded-t-xl p-4 flex items-center justify-center h-24">
                  <span className="text-4xl">{product.imageEmoji}</span>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-[11px] text-bb-green-darker font-semibold uppercase tracking-wide">
                    {categoryLabel(product.categoryId)}
                  </p>
                  <h4 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2 mt-0.5">{product.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{product.unit}</p>

                  <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-gray-900 font-bold text-sm">€{product.price.toFixed(2)}</p>
                      <p className="text-[11px] text-gray-400">
                        {outOfStock ? 'Out of stock' : `${product.stockQty} in stock`}
                      </p>
                    </div>

                    {cartQty > 0 ? (
                      <div className="flex items-center gap-1 bg-bb-green rounded-full text-white text-sm font-bold shadow-sm">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => handleDecrement(product, cartQty)}
                          className="w-7 h-7 flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="min-w-[1.25rem] text-center">{cartQty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={atLimit}
                          onClick={() => handleIncrement(product)}
                          className="w-7 h-7 flex items-center justify-center disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={outOfStock}
                        onClick={() => handleIncrement(product)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
                          !outOfStock
                            ? 'text-bb-green-darker border-bb-green bg-bb-green-light hover:bg-bb-green hover:text-white'
                            : 'text-gray-400 border-gray-200 bg-gray-50'
                        }`}
                      >
                        {outOfStock ? 'Sold Out' : 'ADD'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
