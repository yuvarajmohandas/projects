import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../api/client';
import { HeaderSearch } from './header/HeaderSearch';
import { CategoryMenu } from './header/CategoryMenu';
import type { Category, HomepageLayout } from '../types';

export function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [headerConfig, setHeaderConfig] = useState<HomepageLayout['header']>({ 
    order: ['logo', 'name', 'search', 'navigation', 'cart'], 
    alignment: 'left' 
  });

  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    api.get<HomepageLayout>('/homepage')
      .then((res) => {
        let databaseOrder = res.header.order;
        
        // 🛡️ SECURITY FALLBACK: If the database is missing 'search' from old saves, inject it right in the middle!
        if (!databaseOrder.includes('search')) {
          const fallbackOrder = [...databaseOrder];
          const nameIndex = fallbackOrder.indexOf('name');
          if (nameIndex !== -1) {
            fallbackOrder.splice(nameIndex + 1, 0, 'search');
          } else {
            fallbackOrder.splice(2, 0, 'search');
          }
          databaseOrder = fallbackOrder;
        }

        setHeaderConfig({
          order: databaseOrder,
          alignment: res.header.alignment
        });
      })
      .catch(() => undefined);

    const cached = sessionStorage.getItem('mk_categories');
    if (cached) setCategories(JSON.parse(cached));
    else api.get<{ categories: Category[] }>('/categories').then((res) => { setCategories(res.categories); sessionStorage.setItem('mk_categories', JSON.stringify(res.categories)); }).catch(() => undefined);
  }, []);

  const handleCategoryClick = (name: string) => {
    setSearchParams((prev) => { prev.set('category', name); return prev; });
    navigate(`/?category=${encodeURIComponent(name)}`);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => `px-3 py-1.5 rounded-full text-sm font-semibold transition ${isActive ? 'bg-bb-green-light text-bb-green-darker' : 'text-gray-600 hover:bg-gray-100'}`;
  
  // Spacing helper utility to make layout expand gracefully
  const getAlignRow1 = () => {
    if (headerConfig.alignment === 'center') return 'justify-center gap-8';
    if (headerConfig.alignment === 'right') return 'justify-end gap-6';
    return 'justify-between'; 
  };

  const getAlignRow2 = () => headerConfig.alignment === 'center' ? 'justify-center' : headerConfig.alignment === 'right' ? 'justify-end' : 'justify-start';

  return (
    <header className="sticky top-0 z-20 bg-white shadow-sm border-b border-gray-100 w-full transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex flex-col gap-4">
        
        {/* ROW 1: DYNAMIC FLEX SPACING FILL LAYER CONTAINER */}
        <div className={`flex items-center w-full transition-all duration-300 gap-4 sm:gap-6 ${getAlignRow1()}`}>
          {headerConfig.order.map((componentItem) => {
            
            if (componentItem === 'logo') {
              return (
                <Link key="logo" to="/" className="flex items-center shrink-0">
                  <span className="w-10 h-10 rounded-lg bg-bb-green text-white font-black text-xl flex items-center justify-center shadow-sm">MK</span>
                </Link>
              );
            }

            if (componentItem === 'name') {
              return (
                <Link key="name" to="/" className="hidden sm:flex flex-col leading-tight shrink-0">
                  <span className="text-xl font-extrabold text-gray-900 tracking-tight">MitraKart</span>
                  <span className="text-[11px] font-medium text-bb-green-darker -mt-0.5">Online Grocery · Belgium</span>
                </Link>
              );
            }

            if (componentItem === 'search') {
              // 🔍 The search bar will now render as an expanding element filling empty horizontal gaps!
              return (
                <div key="search" className="flex-1 max-w-xl min-w-[180px]">
                  <HeaderSearch />
                </div>
              );
            }

            if (componentItem === 'navigation') {
              return (
                <div key="navigation" className="flex items-center gap-2 shrink-0">
                  {user?.role === 'ADMIN' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
                  {user ? (
                    <button type="button" onClick={() => { logout(); navigate('/'); }} className="px-3 py-1.5 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
                      Logout ({user.firstName})
                    </button>
                  ) : (
                    <NavLink to="/login" className={linkClass}>Login</NavLink>
                  )}
                </div>
              );
            }

            if (componentItem === 'cart') {
              return (
                <Link key="cart" to="/cart" className="flex items-center gap-2 bg-bb-green hover:bg-bb-green-dark text-white font-bold text-sm px-4 py-2 rounded-full shadow-sm transition shrink-0">
                  <span>🧺</span>
                  <span className="hidden md:inline">Basket</span>
                  <span className="bg-white text-bb-green-darker rounded-full min-w-[1.25rem] h-5 px-1 text-xs font-extrabold flex items-center justify-center">{cartCount}</span>
                </Link>
              );
            }

            return null;
          })}
        </div>

        {/* ROW 2: CATEGORIES DROPDOWN MENU */}
        <div className={`flex flex-wrap items-center gap-4 pt-1 border-t border-gray-50 w-full ${getAlignRow2()}`}>
          <CategoryMenu categories={categories} onCategoryClick={handleCategoryClick} />
          <nav className="flex items-center gap-1">
            {user && <NavLink to="/orders" className={linkClass}>My Orders</NavLink>}
            <NavLink to="/offers" className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-bold transition flex items-center gap-1.5 ${isActive ? 'bg-orange-100 text-orange-700' : 'text-orange-600 hover:bg-orange-50'}`}>
              <span>🏷️ Offers</span>
            </NavLink>
          </nav>
        </div>

      </div>
    </header>
  );
}
