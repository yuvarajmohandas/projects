import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import type { Category, Product } from '../../types';
import { ProductFormSection, type ProductFormState } from './components/ProductFormSection';
import { ProductTableSection } from './components/ProductTableSection';

const productFormDefaults: ProductFormState = {
  sku: '', 
  name: '', 
  description: '', 
  price: '', 
  originalPrice: '', 
  discountPercent: '', 
  unit: 'pcs', 
  vatRate: '0.06', 
  stockQty: '0', 
  categoryId: '',
  imageEmoji: '🛒', 
  imageUrl: '', 
  allergens: '', 
  isActive: true
};

function productToForm(p: Product): ProductFormState {
  const isPromo = p.oldPrice && p.oldPrice > p.price;
  const computedPercent = isPromo 
    ? Math.round(((p.oldPrice! - p.price) / p.oldPrice!) * 100) 
    : 0;

  return {
    sku: p.sku, 
    name: p.name, 
    description: p.description ?? '',
    price: String(p.price), 
    originalPrice: isPromo ? String(p.oldPrice) : String(p.price), 
    discountPercent: computedPercent > 0 ? String(computedPercent) : '',
    unit: p.unit, 
    vatRate: String(p.vatRate), 
    stockQty: String(p.stockQty),
    categoryId: p.categoryId, 
    imageEmoji: p.imageEmoji, 
    imageUrl: p.imageUrl ?? '', 
    allergens: p.allergens.join(', '), 
    isActive: p.isActive
  };
}

function splitAllergens(v: string) { return v.split(/[;,|]/).map(i => i.trim()).filter(Boolean); }

function productFormToPayload(f: ProductFormState) {
  const finalPrice = Number(f.price);
  const finalOriginal = Number(f.originalPrice);
  const hasDiscount = Number(f.discountPercent) > 0;

  return {
    sku: f.sku.trim(), 
    name: f.name.trim(), 
    description: f.description.trim() || undefined,
    price: finalPrice, 
    oldPrice: hasDiscount ? finalOriginal : undefined, 
    unit: f.unit.trim() || 'pcs', 
    vatRate: Number(f.vatRate), 
    stockQty: Number(f.stockQty),
    categoryId: f.categoryId, 
    imageEmoji: f.imageEmoji.trim() || '🛒', 
    imageUrl: f.imageUrl.trim() || undefined, 
    allergens: splitAllergens(f.allergens), 
    isActive: f.isActive
  };
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productError, setProductError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(productFormDefaults);
  const [categoryForm, setCategoryForm] = useState({ name: '', sortOrder: '0' });

  const activeProductsCount = useMemo(() => products.filter(p => p.isActive).length, [products]);
  const categoryLabel = useMemo(() => (id: string) => categories.find(c => c.id === id)?.name ?? '', [categories]);

  function loadProducts() { return api.get<{ products: Product[] }>('/admin/products').then(res => setProducts(res.products)); }
  function loadCategories() {
    return api.get<{ categories: Category[] }>('/admin/categories').then(res => {
      setCategories(res.categories);
      setProductForm(curr => ({ ...curr, categoryId: curr.categoryId || res.categories[0]?.id || '' }));
    });
  }

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  function handleUpdateField(field: keyof ProductFormState, value: string | boolean) {
    setProductForm(curr => ({ ...curr, [field]: value }));
  }

  async function handleSaveProduct(e: FormEvent) {
    e.preventDefault();
    setProductError(null);
    if (!productForm.categoryId) return setProductError('Create a category first');

    try {
      const payload = productFormToPayload(productForm);
      if (editingProductId) await api.put(`/admin/products/${editingProductId}`, payload);
      else await api.post('/admin/products', payload);
      setEditingProductId(null);
      setProductForm({ ...productFormDefaults, categoryId: categories[0]?.id || '' });
      loadProducts();
    } catch (err) { setProductError(err instanceof ApiError ? err.message : 'Failed to save product'); }
  }

  async function handleSaveCategory(e: FormEvent) {
    e.preventDefault();
    setCategoryError(null);
    try {
      await api.post('/admin/categories', { name: categoryForm.name.trim(), sortOrder: Number(categoryForm.sortOrder) });
      setCategoryForm({ name: '', sortOrder: '0' });
      loadCategories();
    } catch (err) { setCategoryError(err instanceof ApiError ? err.message : 'Failed to save category'); }
  }

  async function handleUpdateStock(id: string, stockQty: number) {
    if (Number.isNaN(stockQty) || stockQty < 0) return;
    await api.patch(`/admin/products/${id}/stock`, { stockQty });
    loadProducts();
  }

  async function handleToggleActive(p: Product) {
    await api.put(`/admin/products/${p.id}`, { isActive: !p.isActive });
    loadProducts();
  }

  async function handleDeleteProduct(p: Product) {
    await api.delete(`/admin/products/${p.id}`);
    loadProducts();
  }

  return (
    <div className="space-y-6 p-1 max-w-7xl mx-auto">
      {/* METRIC ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Catalog Management</h2>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Control items, stock levels, and inventory categories.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center bg-gray-50 border border-gray-100 px-4 py-1.5 rounded-xl min-w-[4.5rem]">
            <span className="block text-lg font-black text-gray-900">{products.length}</span>
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Total</span>
          </div>
          <div className="text-center bg-bb-green-light/40 border border-bb-green-light px-4 py-1.5 rounded-xl min-w-[4.5rem]">
            <span className="block text-lg font-black text-bb-green-darker">{activeProductsCount}</span>
            <span className="text-[9px] uppercase font-bold text-bb-green-darker tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD SPLIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <ProductFormSection
            editingProductId={editingProductId}
            productForm={productForm}
            categories={categories}
            productError={productError}
            onUpdateField={handleUpdateField}
            onSubmit={handleSaveProduct}
            onCancel={() => { setEditingProductId(null); setProductForm({ ...productFormDefaults, categoryId: categories[0]?.id || '' }); }}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">🏷️ Create Category</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <input required value={categoryForm.name} onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none bg-gray-50/50" placeholder="Category Name" />
              <input type="number" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm(prev => ({ ...prev, sortOrder: e.target.value }))} className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none bg-gray-50/50" placeholder="Priority" />
              {categoryError && <p className="text-xs text-red-500">{categoryError}</p>}
              <button type="submit" className="w-full bg-gray-900 text-white font-bold text-xs py-2 rounded-lg shadow-sm">Save Category</button>
            </form>
          </div>
        </div>
      </div>

      {/* INVENTORY TABLE SECTION */}
      <ProductTableSection
        products={products}
        onCategoryLabel={categoryLabel}
        onUpdateStock={handleUpdateStock}
        onToggleActive={handleToggleActive}
        onStartEdit={(p) => { setEditingProductId(p.id); setProductForm(productToForm(p)); }}
        onDelete={handleDeleteProduct}
      />
    </div>
  );
}
