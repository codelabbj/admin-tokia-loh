import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserMinus, UserX, Loader2, AlertCircle } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ClientsTable from '../components/clients/ClientsTable';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { useClients, deriveStatus } from '../hooks/useClients';

const ClientsPage = () => {
    const { clients, loading, error, deactivate } = useClients();
    const { toasts, showToast, removeToast } = useToast();
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Clients';
    }, []);

    // Enrichit chaque client avec son statut dérivé des champs API
    const clientsWithStatus = clients.map(c => ({ ...c, status: deriveStatus(c) }));

    // ── Actions ───────────────────────────────────────────────

    const handleDisable = async (client) => {
        // Réactivation non disponible côté API pour l'instant
        if (client.is_active === false) {
            showToast({ message: 'La réactivation n\'est pas encore disponible.', type: 'info' });
            return;
        }
        try {
            await deactivate(client.id);
            showToast({ message: `Client désactivé avec succès.` });
        } catch (err) {
            showToast({ message: err.message ?? 'Erreur lors de la désactivation.', type: 'error' });
        }
    };

    const handleBlock = (client) => {
        // Endpoint de blocage non encore disponible dans l'API v5
        showToast({ message: 'La fonctionnalité de blocage n\'est pas encore disponible.', type: 'info' });
    };

    const handleDelete = (client) => {
        setDeleteTarget(client);
    };

    const handleConfirmDelete = () => {
        // Endpoint DELETE /accounts/clients/:id/ non disponible dans l'API v5
        showToast({ message: 'La suppression n\'est pas encore disponible via l\'API.', type: 'info' });
        setDeleteTarget(null);
    };

    const handleCancelDelete = () => {
        setDeleteTarget(null);
        showToast({ message: 'Suppression annulée.', type: 'info' });
    };

    // ── Stats calculées depuis les données API ────────────────
    const total = clientsWithStatus.length;
    const actifs = clientsWithStatus.filter(c => c.status === 'Actif').length;
    const desactives = clientsWithStatus.filter(c => c.status === 'Désactivé').length;
    const bloques = clientsWithStatus.filter(c => c.status === 'Bloqué').length;

    // ── États de chargement / erreur ──────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary-1" />
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center gap-3 h-48 text-danger-1">
            <AlertCircle size={32} />
            <p className="text-sm font-poppins font-medium">{error}</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div>
                <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                    Clients
                </h1>
                <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                    Gérez vos clients et leur historique
                </p>
            </div>

            {/* ── Stats ── */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total clients"
                    value={String(total)}
                    icon={<Users size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Clients actifs"
                    value={String(actifs)}
                    icon={<UserCheck size={18} />}
                    color="success"
                    trend="up"
                    trendLabel={total > 0 ? `${Math.round((actifs / total) * 100)}%` : '0%'}
                />
                <StatCard
                    title="Désactivés"
                    value={String(desactives)}
                    icon={<UserMinus size={18} />}
                    color="warning"
                />
                <StatCard
                    title="Bloqués"
                    value={String(bloques)}
                    icon={<UserX size={18} />}
                    color="danger"
                />
            </div>

            {/* ── Tableau clients ── */}
            <ClientsTable
                clients={clientsWithStatus}
                onDisable={handleDisable}
                onBlock={handleBlock}
                onDelete={handleDelete}
            />

            {/* ── Modal suppression ── */}
            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                title="Supprimer le client"
                message={`Voulez-vous vraiment supprimer définitivement "${deleteTarget?.first_name} ${deleteTarget?.last_name}" ? Cette action est irréversible.`}
            />

            {/* ── Toasts ── */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default ClientsPage;