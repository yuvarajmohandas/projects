import type { FormEvent } from 'react';
import type { Category } from '../../../types';

export type ProductFormState = {
  sku: string;
  name: string;
  description: string;
  price: string;       // Calculated automatically or overridden manually
  originalPrice: string; // 🌟 NEW: The baseline cost before any sale
  discountPercent: string; // 🌟 NEW: The target discount value (0 to 100)
  unit: string;
  vatRate: string;
  stockQty: string;
  categoryId: string;
  imageEmoji: string;
  imageUrl: string;
  allergens: string;
  isActive: boolean;
};

interface ProductFormSectionProps {
  editingProductId: string | null;
  productForm: ProductFormState;
  categories: Category[];
  productError: string | null;
  onUpdateField: (field: keyof ProductFormState, value: string | boolean) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}

export function ProductFormSection({
  editingProductId,
  productForm,
  categories,
  productError,
  onUpdateField,
  onSubmit,
  onCancel,
}: ProductFormSectionProps) {

  // AUTOMATIC PRICING CALCULATOR METHOD
  // Fires instantly when changing values to update the display sale price
  function handleDiscountMath(field: 'original' | 'percent', value: string) {
    const orig = field === 'original' ? Number(value) : Number(productForm.originalPrice);
    const pct = field === 'percent' ? Number(value) : Number(productForm.discountPercent);

    if (field === 'original') onUpdateField('originalPrice', value);
    if (field === 'percent') onUpdateField('discountPercent', value);

    // Calculate final markdown if both fields hold valid positive values
    if (orig > 0 && pct >= 0 && pct <= 100) {
      const calculatedSalePrice = orig * (1 - pct / 100);
      onUpdateField('price', calculatedSalePrice.toFixed(2));
    } else if (orig > 0 && !pct) {
      onUpdateField('price', orig.toFixed(2));
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-black text-gray-900 tracking-tight mb-4 border-b border-gray-50 pb-2">
        {editingProductId ? '✏️ Edit Product Details' : '➕ Create New Product'}
      </h3>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Row 1: Title & SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Item Title Name</label>
            <input required value={productForm.name} onChange={(e) => onUpdateField('name', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50" placeholder="e.g. Premium White Onions" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">SKU Barcode</label>
            <input required value={productForm.sku} onChange={(e) => onUpdateField('sku', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50" placeholder="e.g. VEG-ONION-WHT" />
          </div>
        </div>

        {/* Row 2: Description */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Item Description Text</label>
          <textarea value={productForm.description} onChange={(e) => onUpdateField('description', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50 h-16 resize-none" placeholder="Enter health details..." />
        </div>

        {/* 💥 Row 3: AUTOMATED PRICING BLOCK */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Original Price (€)</label>
            <input required type="number" step="0.01" min="0" value={productForm.originalPrice} onChange={(e) => handleDiscountMath('original', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50" placeholder="5.00" />
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-red-600 mb-1 font-bold">Discount (%)</label>
            <input type="number" min="0" max="100" value={productForm.discountPercent} onChange={(e) => handleDiscountMath('percent', e.target.value)} className="w-full border border-red-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50/20" placeholder="10" />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1 font-semibold">Calculated Sale Price (€)</label>
            <input readOnly type="number" value={productForm.price} className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-gray-100 cursor-not-allowed font-bold text-gray-700" placeholder="4.50" />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Unit / Pack</label>
            <input required value={productForm.unit} onChange={(e) => onUpdateField('unit', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50" placeholder="e.g. 1pc" />
          </div>
        </div>

        {/* Row 4: Metadata (Department, Image URL, Fallback Emoji) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Department</label>
            <select value={productForm.categoryId} onChange={(e) => onUpdateField('categoryId', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50">
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Product Photo URL</label>
            <input value={productForm.imageUrl} onChange={(e) => onUpdateField('imageUrl', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Fallback Emoji</label>
            <input required value={productForm.imageEmoji} onChange={(e) => onUpdateField('imageEmoji', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50 text-center text-lg" placeholder="🛒" />
          </div>
        </div>

        {/* Row 5: Allergens & Expose Checkbox */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">Allergens Alert</label>
          <input value={productForm.allergens} onChange={(e) => onUpdateField('allergens', e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green bg-gray-50/50" placeholder="gluten" />
        </div>

        <div className="flex items-center gap-2 py-1">
          <input type="checkbox" id="isActiveForm" checked={productForm.isActive} onChange={(e) => onUpdateField('isActive', e.target.checked)} className="w-4 h-4 rounded text-bb-green border-gray-300 focus:ring-bb-green" />
          <label htmlFor="isActiveForm" className="text-xs font-bold text-gray-700 select-none">Expose this product live on storefront</label>
        </div>

        {productError && <p className="text-xs font-bold text-red-500">❌ {productError}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="bg-bb-green hover:bg-bb-green-dark text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm transition-all">
            {editingProductId ? '💾 Overwrite Record' : '✨ Save Product'}
          </button>
          {editingProductId && (
            <button type="button" onClick={onCancel} className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm px-4 py-2 rounded-lg transition-all">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
