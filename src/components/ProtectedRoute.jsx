import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    // Afficher un loader pendant la vérification
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-2">
                <div className="text-neutral-6 text-sm font-poppins">Chargement...</div>
            </div>
        );
    }

    // Rediriger vers login si non authentifié
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Afficher la page si authentifié
    return children;
};

export default ProtectedRoute;