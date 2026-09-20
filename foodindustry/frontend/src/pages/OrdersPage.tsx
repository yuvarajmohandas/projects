import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Order } from '../types';

const statusLabels: Record<string, string> = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  READY_OR_OUT_FOR_DELIVERY: 'Ready / Out for delivery',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ orders: Order[] }>('/orders')
      .then((res) => setOrders(res.orders))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Loading orders...</p>;
  if (orders.length === 0) return <p className="text-gray-400">You haven't placed any orders yet.</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-extrabold text-gray-900">My Orders</h2>
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/orders/${order.id}`}
          className="block bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition"
        >
          <div className="flex justify-between text-sm font-semibold text-gray-900">
            <span>Order #{order.id.slice(0, 8)}</span>
            <span>€{order.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{new Date(order.createdAt).toLocaleString()}</span>
            <span className="text-bb-green-darker font-semibold">{statusLabels[order.status]}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
