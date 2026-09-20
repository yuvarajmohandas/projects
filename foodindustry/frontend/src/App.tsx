import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer'; // 1. Added Footer component import hook
import { ProtectedRoute } from './components/ProtectedRoute';
import { CatalogPage } from './pages/CatalogPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminPromoCodesPage } from './pages/admin/AdminPromoCodesPage';
import { AdminHomepagePage } from './pages/admin/AdminHomepagePage';
import { OffersPage } from './pages/OffersPage'; // 1. ADD THIS IMPORT

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          {/* min-h-screen flex flex-col forces the layout to stretch the full height of your browser */}
          <div className="min-h-screen flex flex-col bg-bb-bg text-gray-800">
            
            {/* The Persistent Dynamic Top Header Row Navigation */}
            <Header />
            
            {/* flex-grow expands like an accordion, pushing the footer down out of the viewport */}
            <main className="flex-grow p-4 sm:p-6 max-w-7xl w-full mx-auto">
              <Routes>
                <Route path="/" element={<CatalogPage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminProductsPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="promo-codes" element={<AdminPromoCodesPage />} />
                  <Route path="homepage" element={<AdminHomepagePage />} />
                </Route>
              </Routes>
            </main>

            {/* 2. Embedded Footer at the terminal bottom baseline strip of the layout wireframe */}
            <Footer />

          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
