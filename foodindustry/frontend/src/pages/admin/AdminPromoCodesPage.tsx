import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import type { PromoCode } from '../../types';

export function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: '10',
    minOrderValue: '0',
    usageLimit: '',
  });

  function loadPromoCodes() {
    api.get<{ promoCodes: PromoCode[] }>('/admin/promo-codes').then((res) => setPromoCodes(res.promoCodes));
  }

  useEffect(loadPromoCodes, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/admin/promo-codes', {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      });
      setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '10', minOrderValue: '0', usageLimit: '' });
      loadPromoCodes();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create promo code');
    }
  }

  async function toggleActive(promo: PromoCode) {
    await api.put(`/admin/promo-codes/${promo.id}`, { isActive: !promo.isActive });
    loadPromoCodes();
  }

  async function remove(id: string) {
    await api.delete(`/admin/promo-codes/${id}`);
    loadPromoCodes();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold mb-4">Promo Codes</h3>
        {promoCodes.length === 0 ? (
          <p className="text-gray-400 text-sm">No promo codes yet.</p>
        ) : (
          <div className="divide-y">
            {promoCodes.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{p.code}</p>
                  <p className="text-xs text-gray-400">
                    {p.discountType === 'PERCENTAGE' ? `${p.discountValue}% off` : `€${p.discountValue.toFixed(2)} off`}
                    {p.minOrderValue > 0 ? ` · min €${p.minOrderValue.toFixed(2)}` : ''} · used {p.usageCount}
                    {p.usageLimit ? `/${p.usageLimit}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => remove(p.id)} className="text-red-500 text-xs">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold mb-4">Add Promo Code</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            placeholder="CODE"
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="PERCENTAGE">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
          </select>
          <input
            placeholder="Discount value"
            type="number"
            step="0.01"
            required
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Minimum order value (€)"
            type="number"
            step="0.01"
            value={form.minOrderValue}
            onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Usage limit (optional)"
            type="number"
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded-lg text-sm">
            Add Promo Code
          </button>
        </form>
      </div>
    </div>
  );
}
