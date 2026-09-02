import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { SplashScreen } from './components/SplashScreen';
import { useStoreData } from './store/useStoreData';
import { HomePage } from './pages/HomePage';
import { CategoryListingPage } from './pages/CategoryListingPage';
import { OfferPage } from './pages/OfferPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { MyCouponsPage } from './pages/MyCouponsPage';
import { MyAddressesPage } from './pages/MyAddressesPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';
import { ShippingPolicyPage } from './pages/ShippingPolicyPage';
import { ReturnsPolicyPage } from './pages/ReturnsPolicyPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { CareTipsPage } from './pages/CareTipsPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminCreateOrderPage } from './pages/admin/AdminCreateOrderPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminOffersPage } from './pages/admin/AdminOffersPage';
import { AdminShippingPage } from './pages/admin/AdminShippingPage';
import { AdminPickupOrdersPage } from './pages/admin/AdminPickupOrdersPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminEnquiriesPage } from './pages/admin/AdminEnquiriesPage';
import { AdminVacationPage } from './pages/admin/AdminVacationPage';
import { PickupPage } from './pages/PickupPage';
import { SearchPage } from './pages/SearchPage';

function App() {
  const { fetchData } = useStoreData();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  );
}

function InnerApp() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [showSplash, setShowSplash] = useState(false);

  return (
    <>
      {showSplash && !isAdminRoute && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div className="w-full min-h-screen">
        <Routes>
          {/* Auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Admin routes */}
          <Route path="/admin/*" element={
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboardPage />} />
                <Route path="/orders" element={<AdminOrdersPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="categories" element={<AdminCategoriesPage />} />
                <Route path="offers" element={<AdminOffersPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="enquiries" element={<AdminEnquiriesPage />} />
                <Route path="vacation" element={<AdminVacationPage />} />
                <Route path="banners" element={<AdminBannersPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Routes>
            </AdminLayout>
          } />

          {/* Main app routes */}
          <Route path="/*" element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/category/:categoryId" element={<CategoryListingPage />} />
                <Route path="/offer/:id" element={<OfferPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/pickup" element={<PickupPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
                <Route path="/returns-policy" element={<ReturnsPolicyPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                <Route path="/jewelry-care" element={<CareTipsPage />} />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </div>
    </>
  );
}

export default App;
