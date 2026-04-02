import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [admin, setAdmin] = useState(() => {
        try {
            const stored = localStorage.getItem('admin');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ── Login ─────────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await authAPI.login(email, password);

            /**
             * Réponse typique :
             * { success, access, refresh, exp, user: { id, email, is_admin, is_superuser } }
             */
            if (!data.success) throw new Error(data.message ?? 'Identifiants incorrects');

            const token = data.access;
            const u = data.user ?? {};
            const adminData = {
                id: u.id ?? null,
                email: u.email ?? '',
                is_admin: !!u.is_admin,
                is_superuser: !!u.is_superuser,
            };

            localStorage.setItem('token', token);
            localStorage.setItem('admin', JSON.stringify(adminData));

            // Stocker aussi le refresh token pour renouvellement futur
            if (data.refresh) localStorage.setItem('refresh', data.refresh);

            setAdmin(adminData);
            return { success: true };
        } catch (err) {
            const message = err.message ?? 'Identifiants incorrects';
            setError(message);
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Logout ────────────────────────────────────────────────
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem('admin');
        setAdmin(null);
        setError(null);
    }, []);

    // ── Changer mot de passe ──────────────────────────────────
    const changePassword = useCallback(async (oldPassword, newPassword, confirmNewPassword) => {
        if (!admin?.email) throw new Error('Admin non connecté');
        const { data } = await authAPI.changePassword(
            admin.email, oldPassword, newPassword, confirmNewPassword
        );
        if (data.success === false) throw new Error(data.message ?? 'Erreur');
        return data;
    }, [admin]);

    // ── Mot de passe oublié ───────────────────────────────────
    const forgotPassword = useCallback(async (email) => {
        const { data } = await authAPI.forgotPassword(email);
        return data;
    }, []);

    // ── Réinitialiser mot de passe ─────────────────────────────
    // ⚠️  v3 : paramètre "otp" (était "code" en v2)
    const resetPassword = useCallback(async (email, otp, newPassword, confirmNewPassword) => {
        const { data } = await authAPI.resetPassword(email, otp, newPassword, confirmNewPassword);
        if (data.success === false) throw new Error(data.message ?? 'Code invalide');
        return data;
    }, []);

    const value = {
        admin,
        isAuthenticated: !!admin,
        loading,
        error,
        login,
        logout,
        changePassword,
        forgotPassword,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider');
    return context;
};