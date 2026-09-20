import type { Product } from '../../../types';

interface ProductTableSectionProps {
  products: Product[];
  onCategoryLabel: (id: string) => string;
  onUpdateStock: (id: string, stockQty: number) => void;
  onToggleActive: (product: Product) => void;
  onStartEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTableSection({
  products,
  onCategoryLabel,
  onUpdateStock,
  onToggleActive,
  onStartEdit,
  onDelete,
}: ProductTableSectionProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-50">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">Active Inventory Registers</h3>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
              <th className="p-3 pl-5">Icon</th>
              <th className="p-3">Product Particulars</th>
              <th className="p-3">Department</th>
              <th className="p-3 text-right">Price Grid</th>
              <th className="p-3 text-center">Discount Badge</th> {/* 💥 ADDED COLUMN */}
              <th className="p-3 text-center">Available Stock</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 pr-5 text-center">Actions Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
            {products.map((p) => {
              const isPromo = p.oldPrice && p.oldPrice > p.price;
              const discountPercentage = isPromo 
                ? Math.round(((p.oldPrice! - p.price) / p.oldPrice!) * 100) 
                : 0;

              return (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 pl-5 text-xl select-none">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-8 h-8 object-contain rounded" />
                    ) : (
                      p.imageEmoji
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{p.sku} · {p.unit}</div>
                  </td>
                  <td className="p-3">
                    <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {onCategoryLabel(p.categoryId)}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900">
                    <div className="flex flex-col items-end">
                      <span>€{p.price.toFixed(2)}</span>
                      {isPromo && <span className="text-[10px] text-gray-400 line-through font-normal">€{p.oldPrice?.toFixed(2)}</span>}
                    </div>
                  </td>
                  
                  {/* 💥 NEW LIVE DISCOUNT BADGE CELL */}
                  <td className="p-3 text-center">
                    {isPromo ? (
                      <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide">
                        🔥 {discountPercentage}% OFF
                      </span>
                    ) : (
                      <span className="text-gray-300 font-normal">—</span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <input type="number" min="0" value={p.stockQty} onChange={(e) => onUpdateStock(p.id, parseInt(e.target.value, 10))} className="w-14 text-center border border-gray-200 rounded p-1 font-bold focus:ring-1 focus:ring-bb-green focus:outline-none" />
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => onToggleActive(p)} className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm transition-all ${p.isActive ? 'bg-bb-green-light border-bb-green text-bb-green-darker' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                      {p.isActive ? 'Live' : 'Hidden'}
                    </button>
                  </td>
                  <td className="p-3 pr-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => onStartEdit(p)} className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded transition-colors">✏️</button>
                      <button onClick={() => onDelete(p)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
