import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useCart } from '../context/CartContext';
import { FulfillmentSection } from './checkout/components/FulfillmentSection';
import { AddressSection } from './checkout/components/AddressSection';
import type { Address, Order } from '../types';

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [slotLabel, setSlotLabel] = useState('');
  const [addressId, setAddressId] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', street: '', houseNumber: '', postalCode: '', city: '' });
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<{ valid: boolean; reason?: string; discountAmount: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_RECEIPT' | 'CARD_ON_RECEIPT'>('CASH_ON_RECEIPT');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<{ addresses: Address[] }>('/addresses').then((res) => {
      setAddresses(res.addresses);
      const def = res.addresses.find((a) => a.isDefault) ?? res.addresses[0];
      if (def) setAddressId(def.id);
      else setShowNewAddress(true);
    });
    api.get<{ slots: string[]; deliveryFee: number }>('/slots').then((res) => {
      setSlots(res.slots);
      setSlotLabel(res.slots[0] ?? '');
      setDeliveryFee(res.deliveryFee);
    });
  }, []);

  const fee = fulfillmentType === 'DELIVERY' ? deliveryFee : 0;
  const discount = promoResult?.valid ? promoResult.discountAmount : 0;
  const total = Math.max(subtotal - discount + fee, 0);

  async function handleValidatePromo() {
    if (!promoCode) {
      setPromoResult(null);
      return;
    }
    const res = await api.post<{ valid: boolean; reason?: string; discountAmount: number }>('/promo/validate', {
      code: promoCode,
      subtotal,
    });
    setPromoResult(res);
  }

  async function ensureAddress(): Promise<string | undefined> {
    if (fulfillmentType !== 'DELIVERY') return undefined;
    if (!showNewAddress && addressId) return addressId;
    const created = await api.post<{ address: Address }>('/addresses', { ...newAddress, isDefault: addresses.length === 0 });
    return created.address.id;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const deliveryAddressId = await ensureAddress();
      const order = await api.post<{ order: Order }>('/orders', {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.qty })),
        fulfillmentType,
        slotLabel,
        deliveryAddressId,
        promoCode: promoResult?.valid ? promoCode : undefined,
        paymentMethod,
      });
      clearCart();
      navigate(`/orders/${order.order.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-center text-gray-400 py-16">Your basket is empty.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-xl font-black text-gray-900 tracking-tight border-b border-gray-50 pb-2">Checkout</h2>

      {/* Component 1: Fulfillment Preference Grid */}
      <FulfillmentSection
        fulfillmentType={fulfillmentType}
        setFulfillmentType={setFulfillmentType}
        slotLabel={slotLabel}
        setSlotLabel={setSlotLabel}
        slots={slots}
      />

      {/* Component 2: Address Section Mapping */}
      {fulfillmentType === 'DELIVERY' && (
        <AddressSection
          addresses={addresses}
          addressId={addressId}
          setAddressId={setAddressId}
          showNewAddress={showNewAddress}
          setShowNewAddress={setShowNewAddress}
          newAddress={newAddress}
          setNewAddress={setNewAddress}
        />
      )}

      {/* Promo Voucher Area */}
      <section className="space-y-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-500">Promo Voucher</h3>
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={(e) => { setPromoCode(e.target.value); setPromoResult(null); }}
            placeholder="e.g. WELCOME10"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green"
          />
          <button
            type="button"
            onClick={handleValidatePromo}
            className="px-5 py-2 rounded-full text-xs font-bold border border-bb-green text-bb-green-darker bg-bb-green-light hover:bg-bb-green hover:text-white transition-all shadow-sm"
          >
            Apply
          </button>
        </div>
        {promoResult && (
          <p className={`text-xs font-semibold mt-1 ${promoResult.valid ? 'text-bb-green-darker' : 'text-red-600'}`}>
            {promoResult.valid ? `Discount applied: -€${promoResult.discountAmount.toFixed(2)}` : `⚠️ ${promoResult.reason}`}
          </p>
        )}
      </section>

      {/* Payment Selection Toggles */}
      <section className="space-y-2">
        <h3 className="text-sm font-black uppercase tracking-wider text-gray-500">Payment Summary</h3>
        <div className="flex gap-3">
          {(['CASH_ON_RECEIPT', 'CARD_ON_RECEIPT'] as const).map((method) => (
            <label key={method} className={`flex items-center gap-2 text-xs font-bold border rounded-xl px-4 py-2.5 shadow-sm cursor-pointer select-none transition-all ${paymentMethod === method ? 'border-bb-green bg-bb-green-light/40 text-bb-green-darker' : 'border-gray-200 bg-white'}`}>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="text-bb-green focus:ring-bb-green"
              />
              {method === 'CASH_ON_RECEIPT' ? '💶 Cash on delivery' : '💳 Card on delivery'}
            </label>
          ))}
        </div>
      </section>

      {/* Total Calculations Ledger Matrix */}
      <section className="border-t border-gray-100 pt-4 space-y-1.5 text-xs font-medium text-gray-600">
        <div className="flex justify-between">
          <span>Gross Basket Subtotal</span>
          <span className="font-bold text-gray-900">€{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-bb-green-darker font-bold">
            <span>Promo Coupon Reduction</span>
            <span>-€{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{fulfillmentType === 'DELIVERY' ? 'Logistics Delivery Fee' : 'Warehouse Pickup Fee'}</span>
          <span className="font-bold text-gray-900">€{fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-black text-gray-900 text-base border-t border-gray-100 pt-2 tracking-tight">
          <span>Grand Invoice Total</span>
          <span className="text-bb-green-darker">€{total.toFixed(2)}</span>
        </div>
      </section>

      {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold">⚠️ {error}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-bb-green hover:bg-bb-green-dark text-white font-black py-3 rounded-full text-sm shadow-sm disabled:opacity-50 transition-all transform active:scale-[0.99]"
      >
        {submitting ? 'Verifying parameters...' : 'Confirm & Place Order'}
      </button>
    </form>
  );
}
