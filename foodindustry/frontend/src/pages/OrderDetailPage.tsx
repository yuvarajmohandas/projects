import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Order } from '../types';

const STEPS = ['PLACED', 'PREPARING', 'READY_OR_OUT_FOR_DELIVERY', 'COMPLETED'];
const stepLabels: Record<string, string> = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  READY_OR_OUT_FOR_DELIVERY: 'Ready / Out for delivery',
  COMPLETED: 'Completed',
};

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ order: Order }>(`/orders/${id}`)
      .then((res) => setOrder(res.order))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-gray-400">Loading order...</p>;

  const currentStepIndex = order.status === 'CANCELLED' ? -1 : STEPS.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">Order #{order.id.slice(0, 8)}</h2>
        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
      </div>

      {order.status === 'CANCELLED' ? (
        <p className="text-red-600 font-semibold">This order was cancelled.</p>
      ) : (
        <div className="flex justify-between">
          {STEPS.map((step, i) => (
            <div key={step} className="flex-1 text-center">
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentStepIndex ? 'bg-bb-green text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              <p className={`text-xs mt-1 ${i <= currentStepIndex ? 'text-bb-green-darker font-semibold' : 'text-gray-400'}`}>
                {stepLabels[step]}
              </p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">Items</h3>
        <div className="divide-y divide-gray-100 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="py-2 flex justify-between">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>€{item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm space-y-1 border-t border-gray-100 pt-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>€{order.subtotal.toFixed(2)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-bb-green-darker">
            <span>Discount</span>
            <span>-€{order.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>{order.fulfillmentType === 'DELIVERY' ? 'Delivery fee' : 'Pickup fee'}</span>
          <span>€{order.deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-gray-100 pt-2">
          <span>Total</span>
          <span>€{order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <p>
          {order.fulfillmentType === 'DELIVERY' ? '🚚 Delivery' : '🏬 Pickup'} — {order.slotLabel}
        </p>
        {order.deliveryAddress && (
          <p>
            {order.deliveryAddress.street} {order.deliveryAddress.houseNumber}, {order.deliveryAddress.postalCode}{' '}
            {order.deliveryAddress.city}
          </p>
        )}
        <p>Payment: {order.paymentMethod === 'CASH_ON_RECEIPT' ? 'Cash on receipt' : 'Card on receipt'}</p>
      </div>
    </div>
  );
}
