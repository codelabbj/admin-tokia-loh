import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, User, Phone, MapPin, Calendar, Clock,
    ShoppingCart, CheckCircle, TrendingUp,
    PauseCircle, Ban, Trash2, Loader2, AlertCircle
} from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useOrders } from '../hooks/useOrders';
import Button from '../components/Button';
import ClientStatusBadge from '../components/clients/ClientStatusBadge';
import StatCard from '../components/dashboard/StatCard';
import OrdersTable from '../components/orders/OrdersTable';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;
const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';
const formatDateTime = (iso) =>
    iso ? new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : '—';

const displayCity = (client) => {
    return client?.city_details?.name ?? '--';
};

const ClientAvatarLarge = ({ firstName, lastName }) => (
    <div className="w-16 h-16 rounded-full bg-primary-1 flex items-center justify-center shrink-0 shadow-md">
        <span className="text-xl font-bold font-poppins text-white">
            {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
        </span>
    </div>
);

const InfoCard = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 bg-neutral-2 dark:bg-neutral-2 rounded-2 px-3 py-2.5">
        <span className="text-primary-1 shrink-0">{icon}</span>
        <div className="min-w-0">
            <p className="text-[11px] font-poppins text-neutral-6">{label}</p>
            <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8 truncate">
                {value ?? '—'}
            </p>
        </div>
    </div>
);

const ClientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { client, loading: clientLoading, error: clientError, deactivate } = useClients(id);
    const { orders, loading: ordersLoading, updateStatus } = useOrders({ clientId: id });

    React.useEffect(() => {
        if (!clientLoading && !client && !clientError) navigate('/clients', { replace: true });
    }, [clientLoading, client, clientError, navigate]);

    React.useEffect(() => {
        if (client) {
            document.title = `Admin Tokia-Loh | ${client.first_name ?? ''} ${client.last_name ?? ''}`;
        }
    }, [client]);

    // ── Champs normalisés depuis l'API ────────────────────────
    const firstName = client?.first_name ?? '';
    const lastName = client?.last_name ?? '';
    const phone = client?.phone ?? '—';
    const city = displayCity(client);
    const joinedAt = formatDate(client?.joined_at);
    const lastLogin = formatDateTime(client?.last_login);
    const status = client?.is_active === false ? 'Désactivé'
        : client?.is_blocked ? 'Bloqué'
            : 'Actif';

    /**
     * L'API retourne `client` comme un simple UUID dans chaque commande.
     * normalizeOrder() construit donc un objet client vide (fullName: "", city: "").
     * On écrase TOUJOURS les champs client ici puisqu'on est sur la fiche
     * d'un client précis et qu'on a déjà toutes ses infos.
     */
    const ordersWithClient = useMemo(() => {
        if (!client) return orders;
        const fullName = `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim();
        return orders.map(o => ({
            ...o,
            client: {
                ...o.client,              // conserve id, phone, coords…
                fullName,                 // ← écrase le "" de normalizeOrder
                firstName: client.first_name ?? '',
                lastName: client.last_name ?? '',
                city: displayCity(client),
            },
        }));
    }, [orders, client]);

    // ── Stats ─────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = ordersWithClient.length;
        const delivered = ordersWithClient.filter(o => o.status === 'delivered').length;
        const spent = ordersWithClient.reduce((acc, o) => {
            const sub = (o.items ?? []).reduce((s, i) => s + i.quantity * i.unitPrice, 0);
            return acc + sub + (o.delivery_fee ?? 0);
        }, 0);
        return { total, delivered, spent };
    }, [ordersWithClient]);

    // ── États de chargement / erreur ──────────────────────────
    if (clientLoading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary-1" />
        </div>
    );

    if (clientError) return (
        <div className="flex flex-col items-center justify-center gap-3 h-48 text-danger-1">
            <AlertCircle size={32} />
            <p className="text-sm font-poppins font-medium">{clientError}</p>
        </div>
    );

    if (!client) return null;

    // ── Actions ───────────────────────────────────────────────
    const handleDisable = async () => {
        if (client.is_active === false) return;
        try {
            await deactivate(client.id);
        } catch (err) {
            console.error('Erreur désactivation :', err);
        }
    };

    const handleBlock = () => {
        console.log('Bloquer/débloquer client :', id);
        // TODO : endpoint à confirmer avec le backend
    };

    const handleDelete = () => {
        if (!window.confirm(`Supprimer définitivement "${firstName} ${lastName}" ?`)) return;
        // TODO : DELETE /accounts/clients/:id/ non dispo en API v5
        navigate('/clients');
    };

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full
                            hover:bg-neutral-3 dark:hover:bg-neutral-3
                            text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {firstName} {lastName}
                        </h1>
                        <p className="text-xs font-poppins text-neutral-6 mt-0.5">Fiche client</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant={status === 'Désactivé' ? 'outline' : 'ghost'}
                        size="normal"
                        onClick={handleDisable}
                    >
                        <PauseCircle size={14} />
                        {status === 'Désactivé' ? 'Réactiver' : 'Désactiver'}
                    </Button>
                    <Button
                        variant={status === 'Bloqué' ? 'outline' : 'dangerOutline'}
                        size="normal"
                        onClick={handleBlock}
                    >
                        <Ban size={14} />
                        {status === 'Bloqué' ? 'Débloquer' : 'Bloquer'}
                    </Button>
                    <Button variant="danger" size="normal" onClick={handleDelete}>
                        <Trash2 size={14} /> Supprimer
                    </Button>
                </div>
            </div>

            {/* ── Fiche client ── */}
            <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 p-5
                flex flex-col sm:flex-row items-start gap-5">
                <ClientAvatarLarge firstName={firstName} lastName={lastName} />
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-base font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {firstName} {lastName}
                        </h2>
                        <ClientStatusBadge status={status} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        <InfoCard icon={<User size={14} />} label="Nom complet" value={`${firstName} ${lastName}`} />
                        <InfoCard icon={<Phone size={14} />} label="Téléphone" value={phone} />
                        <InfoCard icon={<MapPin size={14} />} label="Ville" value={city} />
                        <InfoCard icon={<Calendar size={14} />} label="Inscrit le" value={joinedAt} />
                        <InfoCard icon={<Clock size={14} />} label="Dernière connexion" value={lastLogin} />
                    </div>
                </div>
            </div>

            {/* ── StatCards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    title="Total commandes"
                    value={ordersLoading ? '…' : String(stats.total)}
                    icon={<ShoppingCart size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Commandes livrées"
                    value={ordersLoading ? '…' : String(stats.delivered)}
                    icon={<CheckCircle size={18} />}
                    color="success"
                    trend={stats.delivered > 0 ? 'up' : 'neutral'}
                    trendLabel={stats.total > 0 ? `${Math.round((stats.delivered / stats.total) * 100)}%` : '0%'}
                />
                <StatCard
                    title="Total dépensé"
                    value={ordersLoading ? '…' : formatPrice(stats.spent)}
                    icon={<TrendingUp size={18} />}
                    color="secondary"
                />
            </div>

            {/* ── Historique commandes ── */}
            <div className="flex flex-col gap-3">
                <div>
                    <p className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Historique des commandes
                    </p>
                    <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                        {ordersLoading
                            ? '…'
                            : `${stats.total} commande${stats.total > 1 ? 's' : ''} passée${stats.total > 1 ? 's' : ''} par ce client`
                        }
                    </p>
                </div>

                {!ordersLoading && stats.total === 0 ? (
                    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4
                        rounded-3 flex flex-col items-center gap-2 py-12 text-neutral-5">
                        <ShoppingCart size={32} />
                        <p className="text-xs font-poppins">Aucune commande pour ce client</p>
                    </div>
                ) : (
                    <OrdersTable
                        orders={ordersWithClient}
                        loading={ordersLoading}
                        onStatusChange={updateStatus}
                    />
                )}
            </div>
        </div>
    );
};

export default ClientDetailPage;