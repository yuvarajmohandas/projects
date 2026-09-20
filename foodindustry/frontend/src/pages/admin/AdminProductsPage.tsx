import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import type { Category, Product } from '../../types';

type ProductForm = {
  sku: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  vatRate: string;
  stockQty: string;
  categoryId: string;
  imageEmoji: string;
  allergens: string;
  isActive: boolean;
};

const productFormDefaults: ProductForm = {
  sku: '',
  name: '',
  description: '',
  price: '',
  unit: 'pcs',
  vatRate: '0.06',
  stockQty: '0',
  categoryId: '',
  imageEmoji: '🛒',
  allergens: '',
  isActive: true,
};

const csvTemplate =
  'sku,name,description,price,unit,vatRate,stockQty,categoryName,imageEmoji,allergens,isActive\n' +
  'RICE-BASMATI-5KG,Premium Basmati Rice 5kg,Long-grain aromatic rice,14.99,bag,0.06,40,Rice & Grains,🌾,,true';

function productToForm(product: Product): ProductForm {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? '',
    price: String(product.price),
    unit: product.unit,
    vatRate: String(product.vatRate),
    stockQty: String(product.stockQty),
    categoryId: product.categoryId,
    imageEmoji: product.imageEmoji,
    allergens: product.allergens.join(', '),
    isActive: product.isActive,
  };
}

function splitAllergens(value: string) {
  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function productFormToPayload(form: ProductForm) {
  return {
    sku: form.sku.trim(),
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    price: Number(form.price),
    unit: form.unit.trim() || 'pcs',
    vatRate: Number(form.vatRate),
    stockQty: Number(form.stockQty),
    categoryId: form.categoryId,
    imageEmoji: form.imageEmoji.trim() || '🛒',
    allergens: splitAllergens(form.allergens),
    isActive: form.isActive,
  };
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return ['true', 'yes', 'y', '1', 'active'].includes(normalized);
}

function parseCsvProducts(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one product row');
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());

  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const row = headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});

    const sku = row.sku?.trim();
    const name = row.name?.trim();
    const price = Number(row.price);
    const categoryId = row.categoryid?.trim();
    const categoryName = (row.categoryname || row.category)?.trim();

    if (!sku || !name || Number.isNaN(price) || (!categoryId && !categoryName)) {
      throw new Error(`CSV row ${rowIndex + 2} needs sku, name, price, and categoryName or categoryId`);
    }

    return {
      sku,
      name,
      description: row.description?.trim() || undefined,
      price,
      unit: row.unit?.trim() || 'pcs',
      vatRate: row.vatrate ? Number(row.vatrate) : 0.06,
      stockQty: row.stockqty || row.stock ? Number(row.stockqty || row.stock) : 0,
      categoryId: categoryId || undefined,
      categoryName: categoryName || undefined,
      imageEmoji: row.imageemoji?.trim() || '🛒',
      allergens: splitAllergens(row.allergens || ''),
      isActive: parseBoolean(row.isactive || row.active || ''),
    };
  });
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productError, setProductError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(productFormDefaults);
  const [categoryForm, setCategoryForm] = useState({ name: '', sortOrder: '0' });
  const [csvText, setCsvText] = useState(csvTemplate);

  const activeProducts = useMemo(() => products.filter((product) => product.isActive).length, [products]);

  function formWithDefaultCategory(overrides: Partial<ProductForm> = {}) {
    return { ...productFormDefaults, categoryId: categories[0]?.id ?? '', ...overrides };
  }

  function loadProducts() {
    return api.get<{ products: Product[] }>('/admin/products').then((res) => setProducts(res.products));
  }

  function loadCategories() {
    return api.get<{ categories: Category[] }>('/admin/categories').then((res) => {
      setCategories(res.categories);
      setProductForm((current) => ({
        ...current,
        categoryId: current.categoryId || res.categories[0]?.id || '',
      }));
    });
  }

  function refreshAdminData() {
    void loadProducts();
    void loadCategories();
  }

  useEffect(refreshAdminData, []);

  function updateProductForm(field: keyof ProductForm, value: string | boolean) {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveProduct(e: FormEvent) {
    e.preventDefault();
    setProductError(null);

    if (!productForm.categoryId) {
      setProductError('Create a category before saving products');
      return;
    }

    try {
      const payload = productFormToPayload(productForm);
      if (editingProductId) {
        await api.put(`/admin/products/${editingProductId}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      setEditingProductId(null);
      setProductForm(formWithDefaultCategory());
      refreshAdminData();
    } catch (err) {
      setProductError(err instanceof ApiError ? err.message : 'Failed to save product');
    }
  }

  function startEditingProduct(product: Product) {
    setEditingProductId(product.id);
    setProductError(null);
    setProductForm(productToForm(product));
  }

  function cancelProductEdit() {
    setEditingProductId(null);
    setProductError(null);
    setProductForm(formWithDefaultCategory());
  }

  async function updateStock(id: string, stockQty: number) {
    if (Number.isNaN(stockQty) || stockQty < 0) return;
    await api.patch(`/admin/products/${id}/stock`, { stockQty });
    loadProducts();
  }

  async function toggleActive(product: Product) {
    await api.put(`/admin/products/${product.id}`, { isActive: !product.isActive });
    loadProducts();
  }

  async function archiveProduct(product: Product) {
    await api.delete(`/admin/products/${product.id}`);
    loadProducts();
  }

  async function handleSaveCategory(e: FormEvent) {
    e.preventDefault();
    setCategoryError(null);
    try {
      const payload = { name: categoryForm.name.trim(), sortOrder: Number(categoryForm.sortOrder) };
      if (editingCategoryId) {
        await api.put(`/admin/categories/${editingCategoryId}`, payload);
      } else {
        await api.post('/admin/categories', payload);
      }
      setEditingCategoryId(null);
      setCategoryForm({ name: '', sortOrder: '0' });
      loadCategories();
    } catch (err) {
      setCategoryError(err instanceof ApiError ? err.message : 'Failed to save category');
    }
  }

  function startEditingCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryError(null);
    setCategoryForm({ name: category.name, sortOrder: String(category.sortOrder) });
  }

  function cancelCategoryEdit() {
    setEditingCategoryId(null);
    setCategoryError(null);
    setCategoryForm({ name: '', sortOrder: '0' });
  }

  async function removeCategory(category: Category) {
    setCategoryError(null);
    try {
      await api.delete(`/admin/categories/${category.id}`);
      loadCategories();
    } catch (err) {
      setCategoryError(err instanceof ApiError ? err.message : 'Failed to delete category');
    }
  }

  async function handleCsvFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvText(await file.text());
  }

  async function handleImport(e: FormEvent) {
    e.preventDefault();
    setImportError(null);
    setImportResult(null);

    try {
      const productsToImport = parseCsvProducts(csvText);
      const result = await api.post<{
        created: number;
        updated: number;
        categoriesCreated: number;
      }>('/admin/products/import', { products: productsToImport });
      setImportResult(
        `Imported ${result.created} new products, updated ${result.updated}, created ${result.categoriesCreated} categories.`
      );
      refreshAdminData();
    } catch (err) {
      setImportError(err instanceof ApiError || err instanceof Error ? err.message : 'Failed to import products');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs uppercase font-bold text-gray-400">Products</p>
          <p className="text-2xl font-extrabold">{products.length}</p>
          <p className="text-xs text-gray-500">{activeProducts} active in the shop</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs uppercase font-bold text-gray-400">Categories</p>
          <p className="text-2xl font-extrabold">{categories.length}</p>
          <p className="text-xs text-gray-500">Create categories before adding products</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-xs uppercase font-bold text-gray-400">Import</p>
          <p className="text-2xl font-extrabold">CSV</p>
          <p className="text-xs text-gray-500">Bulk add or update by SKU</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold mb-4">Products & Stock</h3>
          {products.length === 0 ? (
            <p className="text-gray-400 text-sm">No products yet. Add one manually or import a CSV.</p>
          ) : (
            <div className="divide-y">
              {products.map((product) => (
                <div key={product.id} className="py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {product.imageEmoji} {product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {product.category?.name} · €{product.price.toFixed(2)} / {product.unit} · SKU {product.sku}
                    </p>
                    {product.description && <p className="text-xs text-gray-500 mt-1">{product.description}</p>}
                    {product.allergens.length > 0 && (
                      <p className="text-xs text-amber-700 mt-1">Allergens: {product.allergens.join(', ')}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      defaultValue={product.stockQty}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== product.stockQty) updateStock(product.id, val);
                      }}
                      className="w-20 border rounded-lg px-2 py-1 text-sm text-center"
                      aria-label={`Stock for ${product.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleActive(product)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditingProduct(product)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => archiveProduct(product)} className="text-red-500 text-xs">
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold mb-4">{editingProductId ? 'Edit Product' : 'Add Product'}</h3>
          <form onSubmit={handleSaveProduct} className="space-y-3">
            <input
              placeholder="SKU"
              required
              value={productForm.sku}
              onChange={(e) => updateProductForm('sku', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Name"
              required
              value={productForm.name}
              onChange={(e) => updateProductForm('name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Description"
              value={productForm.description}
              onChange={(e) => updateProductForm('description', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-20"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Price (€)"
                type="number"
                step="0.01"
                min={0}
                required
                value={productForm.price}
                onChange={(e) => updateProductForm('price', e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Unit"
                value={productForm.unit}
                onChange={(e) => updateProductForm('unit', e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="VAT rate"
                type="number"
                step="0.01"
                min={0}
                max={1}
                value={productForm.vatRate}
                onChange={(e) => updateProductForm('vatRate', e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Stock qty"
                type="number"
                min={0}
                value={productForm.stockQty}
                onChange={(e) => updateProductForm('stockQty', e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Emoji"
                value={productForm.imageEmoji}
                onChange={(e) => updateProductForm('imageEmoji', e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={productForm.isActive}
                  onChange={(e) => updateProductForm('isActive', e.target.checked)}
                />
                Active
              </label>
            </div>
            <select
              required
              value={productForm.categoryId}
              onChange={(e) => updateProductForm('categoryId', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Allergens, comma separated"
              value={productForm.allergens}
              onChange={(e) => updateProductForm('allergens', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            {productError && <p className="text-red-600 text-xs">{productError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-sm">
                {editingProductId ? 'Save Product' : 'Add Product'}
              </button>
              {editingProductId && (
                <button
                  type="button"
                  onClick={cancelProductEdit}
                  className="px-4 border rounded-lg text-sm font-bold text-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold mb-4">Categories</h3>
          {categoryError && <p className="text-red-600 text-xs mb-3">{categoryError}</p>}
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{category.name}</p>
                  <p className="text-xs text-gray-400">
                    Sort order {category.sortOrder} · {category.productCount ?? 0} products
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEditingCategory(category)}
                    className="text-gray-600 text-xs font-bold"
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => removeCategory(category)} className="text-red-500 text-xs">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold mb-4">{editingCategoryId ? 'Edit Category' : 'Add Category'}</h3>
          <form onSubmit={handleSaveCategory} className="space-y-3">
            <input
              placeholder="Category name"
              required
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Sort order"
              type="number"
              value={categoryForm.sortOrder}
              onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-sm">
                {editingCategoryId ? 'Save Category' : 'Add Category'}
              </button>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={cancelCategoryEdit}
                  className="px-4 border rounded-lg text-sm font-bold text-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold">Import Products from CSV</h3>
            <p className="text-sm text-gray-500">
              Paste CSV or upload a file. Existing products are updated by SKU; new categories are created from
              categoryName.
            </p>
          </div>
          <label className="inline-flex items-center justify-center px-4 py-2 border rounded-lg text-sm font-bold text-gray-700 cursor-pointer">
            Upload CSV
            <input type="file" accept=".csv,text/csv" onChange={handleCsvFile} className="hidden" />
          </label>
        </div>
        <form onSubmit={handleImport} className="space-y-3">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-xs font-mono min-h-36"
            spellCheck={false}
          />
          {importError && <p className="text-red-600 text-xs">{importError}</p>}
          {importResult && <p className="text-green-700 text-xs">{importResult}</p>}
          <button type="submit" className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
            Import Products
          </button>
        </form>
      </div>
    </div>
  );
}
