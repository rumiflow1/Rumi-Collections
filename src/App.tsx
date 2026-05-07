/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ConfigProvider } from './context/ConfigContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import AIStylistPro from './components/AIStylistPro';
import AnnouncementBar from './components/AnnouncementBar';
import SearchOverlay from './components/SearchOverlay';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Support from './pages/Support';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import LuxeAdmin from './pages/admin/EAdmin';
import { useAuth } from './hooks/useAuth';
import { useActivityTracker } from './hooks/useActivityTracker';
import PurchaseNotification from './components/PurchaseNotification';
import NewsletterPopup from './components/NewsletterPopup';

const AdminRoute = ({ children, superAdminOnly = false }: { children: React.ReactNode; superAdminOnly?: boolean }) => {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user || !isAdmin) return <Navigate to="/auth" />;
  if (superAdminOnly && !isSuperAdmin) return <Navigate to="/" />;
  
  return <>{children}</>;
};

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // Safety check for dynamic content
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname, search]);
  return null;
}

function AppContent() {
  const location = useLocation();
  useActivityTracker();
  const isHome = location.pathname === '/';
  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/e-admin');

  if (isAdminPath) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminRoute><LuxeAdmin /></AdminRoute>} />
        <Route path="/e-admin" element={<AdminRoute><LuxeAdmin /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <SearchOverlay />
      <div className={`flex-grow ${!isHome ? 'pt-32' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/contact" element={<Support />} />
          <Route path="/shipping" element={<Support />} />
          <Route path="/returns" element={<Support />} />
          <Route path="/faq" element={<Support />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <Footer />
      <AIStylistPro />
      <PurchaseNotification />
      <NewsletterPopup />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <AppProvider>
          <Router>
            <ScrollToTop />
            <AppContent />
          </Router>
        </AppProvider>
      </ConfigProvider>
    </ErrorBoundary>
  );
}
