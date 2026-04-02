import React, { useState, useEffect, useRef } from 'react';
import { Users, UserCheck, UserMinus, UserX, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router';
import StatCard from '../components/dashboard/StatCard';
import ClientsTable from '../components/clients/ClientsTable';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { useClients, deriveStatus, CLIENTS_LIST_PAGE_SIZE } from '../hooks/useClients';
import { findClientListPage } from '../utils/findListPage';

const ClientsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const highlightClient = searchParams.get('highlightClient')?.trim() ?? '';
    const resolvingRef = useRef(false);
    const [tableFlashId, setTableFlashId] = useState('');

    const {
        clients,
        loading,
        error,
        deactivate,
        reactivate,
        page,
        setPage,
        totalPages,
        totalCount,
        pageSize,
    } = useClients();
    const { toasts, showToast, removeToast } = useToast();

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Clients';
    }, []);

    useEffect(() => {
        if (!highlightClient || loading) return;

        const onPage = clients.some((c) => String(c.id) === highlightClient);
        if (onPage) {
            setTableFlashId(highlightClient);
            const t = window.setTimeout(() => {
                document.getElementById(`client-row-${highlightClient}`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
                setSearchParams((p) => {
                    p.delete('highlightClient');
                    return p;
                }, { replace: true });
                window.setTimeout(() => setTableFlashId(''), 2200);
            }, 80);
            return () => clearTimeout(t);
        }

        if (resolvingRef.current) return;
        resolvingRef.current = true;
        (async () => {
            try {
                const targetPage = await findClientListPage(
                    highlightClient,
                    pageSize ?? CLIENTS_LIST_PAGE_SIZE,
                );
                if (targetPage != null) setPage(targetPage);
                else {
                    setSearchParams((p) => {
                        p.delete('highlightClient');
                        return p;
                    }, { replace: true });
                }
            } finally {
                resolvingRef.current = false;
            }
        })();
    }, [highlightClient, loading, clients, setPage, setSearchParams, pageSize]);

    // Enrichit chaque client avec son statut dérivé des champs API
    const clientsWithStatus = clients.map(c => ({ ...c, status: deriveStatus(c) }));

    // ── Actions ───────────────────────────────────────────────

    const handleDisable = async (client) => {
        try {
            if (client.is_active === false) {
                await reactivate(client.id);
                showToast({ message: 'Client réactivé avec succès.' });
            } else {
                await deactivate(client.id);
                showToast({ message: 'Client désactivé avec succès.' });
            }
        } catch (err) {
            showToast({
                message: err.message ?? 'Erreur lors de la mise à jour du client.',
                type: 'error',
            });
        }
    };

    const handleBlock = (client) => {
        // Endpoint de blocage non encore disponible dans l'API v5
        showToast({ message: 'La fonctionnalité de blocage n\'est pas encore disponible.', type: 'info' });
    };

    // ── Stats : total catalogue (count API) · répartition sur la page courante ──
    const totalListed = clientsWithStatus.length;
    const actifs = clientsWithStatus.filter(c => c.status === 'Actif').length;
    const desactives = clientsWithStatus.filter(c => c.status === 'Désactivé').length;
    const bloques = clientsWithStatus.filter(c => c.status === 'Bloqué').length;

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
                    value={loading ? '…' : String(totalCount)}
                    caption="Tous les comptes (API)"
                    icon={<Users size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Clients actifs"
                    value={loading ? '…' : String(actifs)}
                    caption="Sur cette page"
                    icon={<UserCheck size={18} />}
                    color="success"
                    trend="up"
                    trendLabel={totalListed > 0 ? `${Math.round((actifs / totalListed) * 100)}%` : '0%'}
                />
                <StatCard
                    title="Désactivés"
                    value={loading ? '…' : String(desactives)}
                    caption="Sur cette page"
                    icon={<UserMinus size={18} />}
                    color="warning"
                />
                <StatCard
                    title="Bloqués"
                    value={loading ? '…' : String(bloques)}
                    caption="Sur cette page"
                    icon={<UserX size={18} />}
                    color="danger"
                />
            </div>

            {/* ── Tableau clients ── */}
            <ClientsTable
                clients={clientsWithStatus}
                loading={loading}
                onDisable={handleDisable}
                onBlock={handleBlock}
                highlightRowId={highlightClient || tableFlashId}
                pagination={{
                    page,
                    totalPages,
                    totalCount,
                    pageSize,
                    onPageChange: setPage,
                }}
            />

            {/* ── Toasts ── */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default ClientsPage;