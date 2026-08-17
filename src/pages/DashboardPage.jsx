import React, { useState, useEffect, useCallback } from 'react';
import {
    ShoppingCart, TrendingUp, Package, Users, UserPlus, LayoutGrid,
    BadgeDollarSign, TrendingDown, AlertCircle,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { dashboardAPI } from '../api/dashboard.api';
import StatCard from '../components/dashboard/StatCard';
import RecentOrders from '../components/dashboard/RecentOrders';
import LowStockList from '../components/dashboard/LowStockList';
import SalesChart from '../components/dashboard/SalesChart';
import TopCities from '../components/dashboard/TopCities';
import MonthlyWeekRevenue from '../components/dashboard/MonthlyWeekRevenue';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import SalesByProductTable from '../components/reports/SalesByProductTable';

const formatCFA = (amount) =>
    amount != null ? `${Number(amount).toLocaleString('fr-FR')} F` : '— F';

// ── Hook bénéfices ────────────────────────────────────────────
const useProfit = (params = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await dashboardAPI.getProfit(params);
            setData(res.data);
        } catch (err) {
            setError(err.message ?? 'Erreur chargement bénéfices');
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(params)]);

    useEffect(() => { fetch(); }, [fetch]);
    return { data, loading, error, refetch: fetch };
};

// ── Hook commandes livrées ────────────────────────────────────
const normalizeDeliveredOrder = (raw) => ({
    id: raw.order_id,
    reference: raw.order_reference ?? '—',
    clientName: raw.client_name ?? '—',
    date: raw.created_at ?? null,
    total: Number(raw.total ?? 0),
    totalCost: raw.total_cost != null ? Number(raw.total_cost) : null,
    totalProfit: raw.total_profit != null ? Number(raw.total_profit) : null,
    items: (raw.items ?? []).map((item) => ({
        productName: item.product_name ?? '—',
        productImage: item.product_image ?? null,
        quantity: item.quantity ?? 0,
        price: Number(item.price ?? 0),
        supplierPrice: item.supplier_price != null ? Number(item.supplier_price) : null,
        profit: item.profit != null ? Number(item.profit) : null,
    })),
});

const useDeliveredOrders = (params = {}) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await dashboardAPI.getDeliveredOrders(params);
            setOrders((res.data?.orders ?? []).map(normalizeDeliveredOrder));
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(params)]);

    useEffect(() => { fetch(); }, [fetch]);
    return { orders, loading };
};
const DashboardPage = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [dashParams, setDashParams] = useState({});
    const [appliedStart, setAppliedStart] = useState('');
    const [appliedEnd, setAppliedEnd] = useState('');

    // ── Filtre bénéfices (indépendant du filtre principal) ──
    const [profitFilter, setProfitFilter] = useState('all');
    const [profitParams, setProfitParams] = useState({});
    const [profitStart, setProfitStart] = useState('');
    const [profitEnd, setProfitEnd] = useState('');

    const { stats, loading, error } = useDashboard(dashParams);
    const { data: profitData, loading: profitLoading } = useProfit(profitParams);
    const { orders: deliveredOrders, loading: deliveredLoading } = useDeliveredOrders(profitParams);

    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Tableau de bord';
    }, []);

    // Filtre rapide → paramètre period + réinitialise les dates affichées
    const handleQuickFilter = (filterKey) => {
        setActiveFilter(filterKey);
        setAppliedStart('');
        setAppliedEnd('');
        if (filterKey === 'all') setDashParams({});
        if (filterKey === 'today') setDashParams({ period: 'today' });
        if (filterKey === 'week') setDashParams({ period: 'this_week' });
        if (filterKey === 'month') setDashParams({ period: 'this_month' });
    };

    // Bouton "Appliquer" dans DateRangeFilter
    // start/end : format YYYY-MM-DD (input[type=date])
    // API v3 attend : DD-MM-YYYY
    const handleApplyDates = (start, end) => {
        const toApi = (iso) => {
            const [y, m, d] = iso.split('-');
            return `${d}-${m}-${y}`;
        };
        setActiveFilter('custom');
        setAppliedStart(start);
        setAppliedEnd(end);
        setDashParams({ start_date: toApi(start), end_date: toApi(end) });
    };

    // ── Handlers filtre bénéfices ──
    const handleProfitQuickFilter = (key) => {
        setProfitFilter(key);
        setProfitStart('');
        setProfitEnd('');
        if (key === 'all') setProfitParams({});
        if (key === 'today') setProfitParams({ period: 'today' });
        if (key === 'week') setProfitParams({ period: 'this_week' });
        if (key === 'month') setProfitParams({ period: 'this_month' });
    };

    const handleProfitApplyDates = (start, end) => {
        const toApi = (iso) => { const [y, m, d] = iso.split('-'); return `${d}-${m}-${y}`; };
        setProfitFilter('custom');
        setProfitStart(start);
        setProfitEnd(end);
        setProfitParams({ start_date: toApi(start), end_date: toApi(end) });
    };

    if (loading) return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-8 w-48 bg-neutral-3 rounded-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                <div className="h-28 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
                <div className="h-28 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 h-72 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
                <div className="h-72 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
            </div>
            <div className="h-40 bg-neutral-3 dark:bg-neutral-3 rounded-3 max-w-4xl" />
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-48">
            <p className="text-sm font-poppins text-danger-1">{error}</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">

            {/* ── Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                        Dashboard
                    </h1>
                    <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                        Vue globale de l'activité Tokia-Loh
                    </p>
                </div>
                <DateRangeFilter
                    activeFilter={activeFilter}
                    startDate={appliedStart}
                    endDate={appliedEnd}
                    onQuickFilter={handleQuickFilter}
                    onApplyDates={handleApplyDates}
                />
            </div>

            {/* ── StatCards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Chiffre d'affaires"
                    value={formatCFA(stats?.total_revenue)}
                    icon={<TrendingUp size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Total commandes"
                    value={stats?.total_orders?.toLocaleString('fr-FR') ?? '—'}
                    icon={<ShoppingCart size={18} />}
                    color="secondary"
                />
                <StatCard
                    title="Produits vendus"
                    value={
                        stats?.products_sold != null
                            ? Number(stats.products_sold).toLocaleString('fr-FR')
                            : '—'
                    }
                    icon={<Package size={18} />}
                    color="success"
                />
                <StatCard
                    title="Panier moyen"
                    value={formatCFA(stats?.average_basket)}
                    icon={<Users size={18} />}
                    color="warning"
                />
            </div>

            {/* ── Clients + catalogue (API dashboard) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                <StatCard
                    title="Nouveaux clients"
                    value={
                        stats?.new_clients_week != null
                            ? Number(stats.new_clients_week).toLocaleString('fr-FR')
                            : '—'
                    }
                    //caption="Inscriptions cette semaine (champ API new_client_count_current_week)."
                    icon={<UserPlus size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Produits au catalogue"
                    value={
                        stats?.total_products != null
                            ? Number(stats.total_products).toLocaleString('fr-FR')
                            : '—'
                    }
                    //caption="Nombre de références catalogue (total_products), distinct du volume vendu."
                    icon={<LayoutGrid size={18} />}
                    color="secondary"
                />
            </div>

            {/* ── Graphique + Top villes ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <SalesChart data={stats?.sales_chart ?? []} />
                </div>
                <div>
                    <TopCities data={stats?.top_cities ?? []} />
                </div>
            </div>

            <MonthlyWeekRevenue weeks={stats?.monthly_revenue_by_week ?? []} />

            {/* ── Commandes récentes + Ruptures ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <RecentOrders orders={stats?.recent_orders ?? []} />
                </div>
                <div>
                    <LowStockList products={stats?.low_stock ?? []} />
                </div>
            </div>

            {/* ══ Section Bénéfices ══════════════════════════════════════ */}
            <div className="flex flex-col gap-4 pt-2">

                {/* Header section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-h6 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                            Bénéfices Tokia-Loh
                        </h2>
                        <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                            Calcul basé sur le prix fournisseur vs prix de vente
                        </p>
                    </div>
                    <DateRangeFilter
                        activeFilter={profitFilter}
                        startDate={profitStart}
                        endDate={profitEnd}
                        onQuickFilter={handleProfitQuickFilter}
                        onApplyDates={handleProfitApplyDates}
                    />
                </div>

                {profitLoading ? (
                    <div className="flex flex-col gap-4 animate-pulse">
                        <div className="h-28 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="h-28 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
                            <div className="h-28 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
                        </div>
                    </div>
                ) : profitData ? (
                    <>
                        {/* Plan client : CA en haut, puis CA fournisseurs + Bénéfices */}
                        <div className="flex flex-col gap-4">
                            <StatCard
                                title="Chiffre d'affaires"
                                value={formatCFA(profitData.summary?.total_revenue)}
                                icon={<TrendingUp size={18} />}
                                color="primary"
                                caption={
                                    profitData.summary?.orders_count != null
                                        ? `${Number(profitData.summary.orders_count).toLocaleString('fr-FR')} commande(s)`
                                        : undefined
                                }
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard
                                    title="Chiffre d'affaire fournisseurs"
                                    value={formatCFA(profitData.summary?.total_supplier_cost)}
                                    icon={<TrendingDown size={18} />}
                                    color="warning"
                                    caption="Total des coûts fournisseurs sur la période"
                                />
                                <StatCard
                                    title="Bénéfices"
                                    value={formatCFA(profitData.summary?.total_profit)}
                                    icon={<BadgeDollarSign size={18} />}
                                    color="success"
                                    caption={
                                        profitData.summary?.profit_margin_pct != null
                                            ? `Marge ${profitData.summary.profit_margin_pct}%`
                                            : undefined
                                    }
                                />
                            </div>
                        </div>

                        {/* Avertissement produits sans supplier_price */}
                        {profitData.summary?.items_without_supplier_price > 0 && (
                            <div className="flex items-start gap-3 p-3 rounded-md border border-warning-3 bg-warning-4/30">
                                <AlertCircle size={16} className="text-warning-1 shrink-0 mt-0.5" />
                                <p className="text-xs font-poppins text-warning-1">
                                    <strong>{profitData.summary.items_without_supplier_price}</strong> article(s) vendu(s) n'ont pas de prix fournisseur défini — le bénéfice affiché est partiel.
                                    Ajoutez un prix fournisseur sur ces produits pour un calcul complet.
                                </p>
                            </div>
                        )}

                        {/* Top commandes livrées avec bénéfices */}
                        <SalesByProductTable data={deliveredOrders} />
                    </>
                ) : null}
            </div>

        </div>
    );
};

export default DashboardPage;