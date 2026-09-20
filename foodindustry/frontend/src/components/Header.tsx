import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';
import type { HomepageLayout } from '../types';

export function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [header, setHeader] = useState<HomepageLayout['header']>({ order: ['logo', 'name', 'navigation', 'cart'], alignment: 'left' });
  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    api.get<HomepageLayout>('/homepage').then((layout) => setHeader(layout.header)).catch(() => undefined);
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-full text-sm font-semibold transition ${
      isActive ? 'bg-bb-green-light text-bb-green-darker' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <header className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-100">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-3 items-center ${header.alignment === 'center' ? 'justify-center' : header.alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
        {header.order.map((item) => {
          if (item === 'logo' || item === 'name') {
            return (
              <Link key={item} to="/" className={`flex items-center gap-2 shrink-0 ${item === 'name' ? 'order-2' : ''}`}>
                {item === 'logo' && <span className="w-9 h-9 rounded-lg bg-bb-green text-white font-black text-lg flex items-center justify-center shadow-sm">MK</span>}
                {item === 'name' && <span className="flex flex-col leading-tight"><span className="text-lg font-extrabold tracking-tight text-gray-900">MitraKart</span><span className="text-[11px] font-medium text-bb-green-darker -mt-0.5">Online Grocery · Belgium</span></span>}
              </Link>
            );
          }
          if (item === 'navigation') {
            return (
              <nav key={item} className="flex flex-wrap gap-1 items-center order-3 w-full sm:w-auto justify-center sm:justify-start">
                <NavLink to="/" className={linkClass} end>Shop</NavLink>
                {user && <NavLink to="/orders" className={linkClass}>My Orders</NavLink>}
                {user?.role === 'ADMIN' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
                {user ? <button onClick={() => { logout(); navigate('/'); }} className="px-3 py-2 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100">Logout ({user.firstName})</button> : <NavLink to="/login" className={linkClass}>Login</NavLink>}
              </nav>
            );
          }
          return (
            <Link key={item} to="/cart" className="order-4 flex items-center gap-2 bg-bb-green hover:bg-bb-green-dark text-white font-bold text-sm px-4 py-2 rounded-full shadow-sm transition">
              <span aria-hidden>🧺</span><span>Basket</span><span className="bg-white text-bb-green-darker rounded-full min-w-[1.25rem] h-5 px-1 text-xs font-extrabold flex items-center justify-center">{cartCount}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
