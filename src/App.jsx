import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Layout ────────────────────────────────────────────────────
import Layout from './components/layout/Layout';

// ── Pages publiques ───────────────────────────────────────────
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// ── Pages protégées ───────────────────────────────────────────
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import VillesPage from './pages/VillesPage';
import VilleDetailPage from './pages/VilleDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import PublishPage from './pages/PublishPage';
import ProfilePage from './pages/ProfilePage';

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

                <Route path="/products" element={<PrivatePage page={ProductsPage} showSearch={false} />} />
                <Route path="/products/:id" element={<PrivatePage page={ProductDetailPage} showSearch={false} />} />

                <Route path="/categories" element={<PrivatePage page={CategoriesPage} />} showSearch={false} />
                <Route path="/categories/:id" element={<PrivatePage page={CategoryDetailPage} showSearch={false} />} />

                <Route path="/orders" element={<PrivatePage page={OrdersPage} showSearch={false} />} />
                <Route path="/orders/:id" element={<PrivatePage page={OrderDetailPage} showSearch={false} />} />

                <Route path="/clients" element={<PrivatePage page={ClientsPage} showSearch={false} />} />
                <Route path="/clients/:id" element={<PrivatePage page={ClientDetailPage} showSearch={false} />} />

                <Route path="/cities" element={<PrivatePage page={VillesPage} showSearch={false} />} />
                <Route path="/cities/:id" element={<PrivatePage page={VilleDetailPage} showSearch={false} />} />

                <Route path="/notifications" element={<PrivatePage page={NotificationsPage} showSearch={false} />} />
                <Route path="/reports" element={<PrivatePage page={ReportsPage} />} showSearch={false} />
                <Route path="/settings" element={<PrivatePage page={SettingsPage} showSearch={false} />} />
                <Route path="/publish" element={<PrivatePage page={PublishPage} showSearch={false} />} />
                <Route path="/profile" element={<PrivatePage page={ProfilePage} showSearch={false} />} />

                {/* ── 404 → dashboard ── */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Routes>
        </BrowserRouter>
    </AuthProvider>
);

export default App;