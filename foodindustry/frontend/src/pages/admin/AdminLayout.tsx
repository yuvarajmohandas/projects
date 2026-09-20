import { NavLink, Outlet } from 'react-router-dom';

export function AdminLayout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-green-600 text-white' : 'bg-white border text-gray-600'}`;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin / Back-office</h2>
      <nav className="flex gap-2">
        <NavLink to="/admin/products" className={linkClass}>
          📦 Products & Stock
        </NavLink>
        <NavLink to="/admin/orders" className={linkClass}>
          🧾 Orders
        </NavLink>
        <NavLink to="/admin/promo-codes" className={linkClass}>
          🏷️ Promo Codes
        </NavLink>
        <NavLink to="/admin/homepage" className={linkClass}>
          🖼️ Homepage editor
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
