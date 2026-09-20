import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Order, OrderStatus } from '../../types';

const STATUSES: OrderStatus[] = ['PLACED', 'PREPARING', 'READY_OR_OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];
const statusLabels: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  READY_OR_OUT_FOR_DELIVERY: 'Ready / Out for delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  function loadOrders() {
    api.get<{ orders: Order[] }>('/admin/orders').then((res) => setOrders(res.orders));
  }

  useEffect(loadOrders, []);

  async function updateStatus(id: string, status: OrderStatus) {
    await api.patch(`/admin/orders/${id}/status`, { status });
    loadOrders();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="font-bold mb-4">All Orders</h3>
      {orders.length === 0 ? (
        <p className="text-gray-400 text-sm">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-xl p-4 text-sm">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <p className="font-semibold">
                    #{order.id.slice(0, 8)} — {order.user?.firstName} {order.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleString()} · {order.fulfillmentType} · €{order.total.toFixed(2)}
                  </p>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                  className="border rounded-lg px-2 py-1 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabels[s]}
                    </option>
                  ))}
                </select>
              </div>
              <ul className="mt-2 text-xs text-gray-500 list-disc list-inside">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.productName} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
