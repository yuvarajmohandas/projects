import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useCart } from '../context/CartContext';
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
  const [promoResult, setPromoResult] = useState<{ valid: boolean; reason?: string; discountAmount: number } | null>(
    null
  );
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
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <h2 className="text-xl font-extrabold text-gray-900">Checkout</h2>

      <section>
        <h3 className="font-semibold mb-2">Fulfillment</h3>
        <div className="flex gap-3 mb-3">
          {(['DELIVERY', 'PICKUP'] as const).map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setFulfillmentType(type)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                fulfillmentType === type
                  ? 'bg-bb-green text-white border-bb-green'
                  : 'text-gray-600 border-gray-200 hover:border-bb-green hover:text-bb-green-darker'
              }`}
            >
              {type === 'DELIVERY' ? '🚚 Delivery' : '🏬 Pickup'}
            </button>
          ))}
        </div>
        <select
          value={slotLabel}
          onChange={(e) => setSlotLabel(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green"
        >
          {slots.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </section>

      {fulfillmentType === 'DELIVERY' && (
        <section>
          <h3 className="font-semibold mb-2">Delivery Address</h3>
          {addresses.length > 0 && !showNewAddress && (
            <div className="space-y-2 mb-2">
              {addresses.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm border rounded-lg p-2">
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                  />
                  {a.label}: {a.street} {a.houseNumber}, {a.postalCode} {a.city}
                </label>
              ))}
              <button type="button" onClick={() => setShowNewAddress(true)} className="text-bb-green-darker text-xs font-semibold">
                + Use a new address
              </button>
            </div>
          )}
          {(showNewAddress || addresses.length === 0) && (
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Label (e.g. Home)"
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm col-span-2"
              />
              <input
                placeholder="Street"
                required
                value={newAddress.street}
                onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="House number"
                required
                value={newAddress.houseNumber}
                onChange={(e) => setNewAddress({ ...newAddress, houseNumber: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Postal code"
                required
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="City"
                required
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              {addresses.length > 0 && (
                <button type="button" onClick={() => setShowNewAddress(false)} className="text-bb-green-darker text-xs font-semibold col-span-2 text-left">
                  ← Use a saved address
                </button>
              )}
            </div>
          )}
        </section>
      )}

      <section>
        <h3 className="font-semibold mb-2">Promo Code</h3>
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value);
              setPromoResult(null);
            }}
            placeholder="e.g. WELCOME10"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-green"
          />
          <button
            type="button"
            onClick={handleValidatePromo}
            className="px-4 py-2 rounded-full text-sm border border-bb-green text-bb-green-darker font-semibold hover:bg-bb-green-light"
          >
            Apply
          </button>
        </div>
        {promoResult && (
          <p className={`text-xs mt-1 ${promoResult.valid ? 'text-bb-green-darker' : 'text-red-600'}`}>
            {promoResult.valid ? `Discount applied: -€${promoResult.discountAmount.toFixed(2)}` : promoResult.reason}
          </p>
        )}
      </section>

      <section>
        <h3 className="font-semibold mb-2">Payment</h3>
        <div className="flex gap-3">
          {(['CASH_ON_RECEIPT', 'CARD_ON_RECEIPT'] as const).map((method) => (
            <label
              key={method}
              className={`flex items-center gap-2 text-sm border rounded-lg px-3 py-2 ${
                paymentMethod === method ? 'border-bb-green bg-bb-green-light' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
              />
              {method === 'CASH_ON_RECEIPT' ? 'Cash on receipt' : 'Card on receipt'}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">Online card payment (Stripe/Mollie) is planned for a later release.</p>
      </section>

      <section className="border-t border-gray-100 pt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>€{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-bb-green-darker">
            <span>Discount</span>
            <span>-€{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{fulfillmentType === 'DELIVERY' ? 'Delivery fee' : 'Pickup fee'}</span>
          <span>€{fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
          <span>Total</span>
          <span>€{total.toFixed(2)}</span>
        </div>
      </section>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-bb-green hover:bg-bb-green-dark text-white font-bold py-3 rounded-full text-sm shadow-sm disabled:opacity-50 transition"
      >
        {submitting ? 'Placing order...' : 'Place Order'}
      </button>
    </form>
  );
}
