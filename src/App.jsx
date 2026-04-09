import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Layout ────────────────────────────────────────────────────
import Layout from './components/layout/Layout';
import PageLoader from './components/PageLoader';

// ── Pages publiques ───────────────────────────────────────── (pas lazy : chargées immédiatement)
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// ── Pages protégées ── LAZY : chargées uniquement à la navigation ──────────
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const ProductsPage       = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage  = lazy(() => import('./pages/ProductDetailPage'));
const ProductFormPage    = lazy(() => import('./pages/ProductFormPage'));
const CategoriesPage     = lazy(() => import('./pages/CategoriesPage'));
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage'));
const CategoryFormPage   = lazy(() => import('./pages/CategoryFormPage'));
const MediaLibraryPage   = lazy(() => import('./pages/MediaLibraryPage'));
const OrdersPage         = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage    = lazy(() => import('./pages/OrderDetailPage'));
const ClientsPage        = lazy(() => import('./pages/ClientsPage'));
const ClientDetailPage   = lazy(() => import('./pages/ClientDetailPage'));
const VillesPage         = lazy(() => import('./pages/VillesPage'));
const VilleDetailPage    = lazy(() => import('./pages/VilleDetailPage'));
const NotificationsPage  = lazy(() => import('./pages/NotificationsPage'));
const ReportsPage        = lazy(() => import('./pages/ReportsPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const PublishPage        = lazy(() => import('./pages/PublishPage'));
const ProfilePage        = lazy(() => import('./pages/ProfilePage'));

// ── Guard : redirige vers /login si non connecté ──────────────
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated
        ? children
        : <Navigate to="/login" replace />;
};

// ── Guard : redirige vers /dashboard si déjà connecté ─────────
const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated
        ? <Navigate to="/dashboard" replace />
        : children;
};

// ── Raccourci : page dans le Layout protégé ───────────────────
const PrivatePage = ({ page: Page, showSearch = true }) => (
    <ProtectedRoute>
        <Layout showSearch={showSearch}>
            <Page />
        </Layout>
    </ProtectedRoute>
);

const App = () => (
    <AuthProvider>
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>

                    {/* ── Redirection racine ── */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />

                    {/* ── Routes publiques ── */}
                    <Route path="/login" element={
                        <PublicRoute><LoginPage /></PublicRoute>
                    } />
                    <Route path="/forgot-password" element={
                        <PublicRoute><ForgotPasswordPage /></PublicRoute>
                    } />

                    {/* ── Routes protégées ── */}
                    <Route path="/dashboard" element={<PrivatePage page={DashboardPage} showSearch={false} />} />

                    {/* --- routes produits --- */}
                    <Route path="/products" element={<PrivatePage page={ProductsPage} showSearch={false} />} />
                    <Route path="/products/new" element={<PrivatePage page={ProductFormPage} showSearch={false} />} />
                    <Route path="/products/:id/edit" element={<PrivatePage page={ProductFormPage} showSearch={false} />} />
                    <Route path="/products/:id" element={<PrivatePage page={ProductDetailPage} showSearch={false} />} />

                    <Route path="/media" element={<PrivatePage page={MediaLibraryPage} showSearch={false} />} />

                    <Route path="/categories" element={<PrivatePage page={CategoriesPage} showSearch={false} />} />
                    <Route path="/categories/new" element={<PrivatePage page={CategoryFormPage} showSearch={false} />} />
                    <Route path="/categories/:id/edit" element={<PrivatePage page={CategoryFormPage} showSearch={false} />} />
                    <Route path="/categories/:id" element={<PrivatePage page={CategoryDetailPage} showSearch={false} />} />

                    <Route path="/orders" element={<PrivatePage page={OrdersPage} showSearch={false} />} />
                    <Route path="/orders/:id" element={<PrivatePage page={OrderDetailPage} showSearch={false} />} />

                    <Route path="/clients" element={<PrivatePage page={ClientsPage} showSearch={false} />} />
                    <Route path="/clients/:id" element={<PrivatePage page={ClientDetailPage} showSearch={false} />} />

                    <Route path="/cities" element={<PrivatePage page={VillesPage} showSearch={false} />} />
                    <Route path="/cities/:id" element={<PrivatePage page={VilleDetailPage} showSearch={false} />} />

                    <Route path="/notifications" element={<PrivatePage page={NotificationsPage} showSearch={false} />} />
                    <Route path="/reports" element={<PrivatePage page={ReportsPage} showSearch={false} />} />
                    <Route path="/settings" element={<PrivatePage page={SettingsPage} showSearch={false} />} />
                    <Route path="/publish" element={<PrivatePage page={PublishPage} showSearch={false} />} />
                    <Route path="/profile" element={<PrivatePage page={ProfilePage} showSearch={false} />} />

                    {/* ── 404 → dashboard ── */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />

                </Routes>
            </Suspense>
        </BrowserRouter>
    </AuthProvider>
);

export default App;