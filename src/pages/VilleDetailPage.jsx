import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, Pencil, ShoppingCart,
    CheckCircle, Clock, TrendingUp, MapPin, Loader2
} from 'lucide-react';
import Button from '../components/Button';
import ProductStatusToggle from '../components/products/ProductStatusToggle';
import StatCard from '../components/dashboard/StatCard';
import OrdersTable from '../components/orders/OrdersTable';
import VilleFormModal from '../components/villes/VilleFormModal';
import { useVilles } from '../hooks/useVilles';
import { useOrders } from '../hooks/useOrders';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const VilleAvatarLarge = ({ name }) => (
    <div className="w-16 h-16 rounded-[14px] bg-secondary-1 flex items-center justify-center shrink-0 shadow-md">
        <span className="text-xl font-bold font-poppins text-white uppercase">
            {name?.slice(0, 2) ?? '??'}
        </span>
    </div>
);

const VilleDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);

    // ── Données ville ────────────────────────────────────────
    const { ville, loading: villeLoading, update } = useVilles({ id });

    // ── Commandes de cette ville ─────────────────────────────
    // useOrders ne filtre pas par ville côté API — on récupère toutes
    // les commandes et on filtre localement sur city_name
    const { orders: allOrders, loading: ordersLoading } = useOrders();
    const orders = useMemo(() => {
        if (!ville) return [];
        return allOrders.filter(o =>
            (o.client?.city ?? o.city_name ?? '').toLowerCase() === ville.name.toLowerCase()
        );
    }, [allOrders, ville]);

    useEffect(() => {
        if (ville) {
            document.title = `Admin Tokia-Loh | ${ville.name}`;
        }
    }, [ville]);

    useEffect(() => {
        if (!villeLoading && !ville) {
            navigate('/cities');
        }
    }, [ville, villeLoading, navigate]);

    // ── Stats commandes ──────────────────────────────────────
    const stats = useMemo(() => {
        if (!ville) return { livrees: 0, enCours: 0, caFrais: 0 };
        const livrees = orders.filter(o => o.status === 'delivered').length;
        const enCours = orders.filter(o =>
            ['pending', 'confirmed', 'preparing', 'shipping'].includes(o.status)
        ).length;
        const caFrais = livrees * Number(ville.delivery_price ?? 0);
        return { livrees, enCours, caFrais };
    }, [orders, ville]);

    // ── Handlers ────────────────────────────────────────────
    const handleToggleStatus = async () => {
        await update(ville.id, { is_active: !ville.is_active });
    };

    const handleSave = async (formData) => {
        await update(ville.id, formData);
        setModalOpen(false);
    };

    // ── Loading / not found ──────────────────────────────────
    if (villeLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-primary-1" />
            </div>
        );
    }

    if (!ville) return null;

    const deliveryPrice = Number(ville.delivery_price ?? 0);

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête navigation ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 dark:hover:bg-neutral-3 text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer"
                        title="Retour aux villes"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {ville.name}
                        </h1>
                        <p className="text-xs font-poppins text-neutral-6 mt-0.5">
                            Détail de la ville
                        </p>
                    </div>
                </div>

                <Button
                    variant="primary"
                    size="normal"
                    icon={<Pencil size={14} />}
                    iconPosition="left"
                    onClick={() => setModalOpen(true)}
                >
                    Modifier la ville
                </Button>
            </div>

            {/* ── Fiche ville ── */}
            <div className="
                bg-neutral-0 dark:bg-neutral-0
                border border-neutral-4 dark:border-neutral-4
                rounded-md p-5
                flex flex-col sm:flex-row items-start gap-5
            ">
                <VilleAvatarLarge name={ville.name} />

                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    {/* Nom + badge frais */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-base font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            {ville.name}
                        </h2>
                        {deliveryPrice === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-success-2 text-success-1 font-semibold text-[11px] font-poppins">
                                Livraison gratuite
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-5 text-primary-1 font-semibold text-[11px] font-poppins">
                                {formatPrice(deliveryPrice)} / livraison
                            </span>
                        )}
                    </div>

                    {/* Infos */}
                    <div className="flex items-center gap-5 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-poppins text-neutral-6">
                            <MapPin size={12} className="text-secondary-1" />
                            Zone de livraison {ville.is_active !== false ? 'active' : 'inactive'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-poppins text-neutral-6">
                            <ShoppingCart size={12} className="text-primary-1" />
                            <span className="font-semibold text-neutral-8 dark:text-neutral-8">
                                {orders.length}
                            </span>
                            &nbsp;commande{orders.length > 1 ? 's' : ''} au total
                        </div>
                    </div>
                </div>

                {/* Toggle statut */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-poppins text-neutral-5">Livraison active</span>
                    <ProductStatusToggle
                        active={ville.is_active !== false}
                        onChange={handleToggleStatus}
                    />
                </div>
            </div>

            {/* ── StatCards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total commandes"
                    value={ordersLoading ? '…' : String(orders.length)}
                    icon={<ShoppingCart size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Livrées"
                    value={ordersLoading ? '…' : String(stats.livrees)}
                    icon={<CheckCircle size={18} />}
                    color="success"
                    trend={stats.livrees > 0 ? 'up' : 'neutral'}
                    trendLabel={orders.length > 0 ? `${Math.round((stats.livrees / orders.length) * 100)}%` : '0%'}
                />
                <StatCard
                    title="En cours"
                    value={ordersLoading ? '…' : String(stats.enCours)}
                    icon={<Clock size={18} />}
                    color="warning"
                />
                <StatCard
                    title="CA frais livraison"
                    value={deliveryPrice === 0 ? 'Gratuit' : (ordersLoading ? '…' : formatPrice(stats.caFrais))}
                    icon={<TrendingUp size={18} />}
                    color="secondary"
                />
            </div>

            {/* ── Commandes de la ville ── */}
            <div className="flex flex-col gap-3">
                <div>
                    <p className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Commandes livrées à {ville.name}
                    </p>
                    <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                        {orders.length} commande{orders.length > 1 ? 's' : ''} pour cette ville
                    </p>
                </div>

                {!ordersLoading && orders.length === 0 ? (
                    <div className="
                        bg-neutral-0 dark:bg-neutral-0
                        border border-neutral-4 dark:border-neutral-4
                        rounded-md flex flex-col items-center gap-2 py-12 text-neutral-5
                    ">
                        <ShoppingCart size={32} />
                        <p className="text-xs font-poppins">Aucune commande pour {ville.name}</p>
                    </div>
                ) : (
                    <OrdersTable orders={orders} loading={ordersLoading} />
                )}
            </div>

            {/* ── Modal modification ── */}
            <VilleFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                ville={ville}
                onSave={handleSave}
            />
        </div>
    );
};

export default VilleDetailPage;