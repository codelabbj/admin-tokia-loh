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
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-28 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
                        ))}
                    </div>
                ) : profitData ? (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <StatCard
                                title="Bénéfice net"
                                value={formatCFA(profitData.summary?.total_profit)}
                                icon={<BadgeDollarSign size={18} />}
                                color="success"
                            />
                            <StatCard
                                title="Chiffre d'affaires"
                                value={formatCFA(profitData.summary?.total_revenue)}
                                icon={<TrendingUp size={18} />}
                                color="primary"
                            />
                            <StatCard
                                title="Coût fournisseurs"
                                value={formatCFA(profitData.summary?.total_supplier_cost)}
                                icon={<TrendingDown size={18} />}
                                color="warning"
                            />
                            <StatCard
                                title="Marge"
                                value={
                                    profitData.summary?.profit_margin_pct != null
                                        ? `${profitData.summary.profit_margin_pct}%`
                                        : '—'
                                }
                                icon={<Package size={18} />}
                                color="secondary"
                            />
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

                        {/* Top produits rentables */}
                        {profitData.top_profitable_products?.length > 0 && (
                            <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
                                <div className="px-5 py-3 border-b border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2">
                                    <p className="text-[11px] font-semibold font-poppins text-neutral-6 uppercase tracking-wider">
                                        Top produits les plus rentables
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs font-poppins">
                                        <thead>
                                            <tr className="border-b border-neutral-3 dark:border-neutral-3">
                                                <th className="text-left px-4 py-3 text-neutral-6 font-semibold">Produit</th>
                                                <th className="text-right px-4 py-3 text-neutral-6 font-semibold">Qté vendue</th>
                                                <th className="text-right px-4 py-3 text-neutral-6 font-semibold">CA</th>
                                                <th className="text-right px-4 py-3 text-neutral-6 font-semibold">Coût</th>
                                                <th className="text-right px-4 py-3 text-neutral-6 font-semibold">Bénéfice</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {profitData.top_profitable_products.map((p, i) => (
                                                <tr key={p.product_id} className={`border-b border-neutral-3 dark:border-neutral-3 ${i % 2 === 0 ? 'bg-neutral-1 dark:bg-neutral-1' : ''}`}>
                                                    <td className="px-4 py-3 text-neutral-8 dark:text-neutral-8 font-medium max-w-[200px] truncate">
                                                        {p.product_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-neutral-6">
                                                        {Number(p.total_quantity).toLocaleString('fr-FR')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-neutral-6">
                                                        {formatCFA(p.total_revenue)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-neutral-6">
                                                        {formatCFA(p.total_cost)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold">
                                                        <span className={Number(p.total_profit) >= 0 ? 'text-success-1' : 'text-danger-1'}>
                                                            {formatCFA(p.total_profit)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Aucune donnée */}
                        {profitData.top_profitable_products?.length === 0 && (
                            <div className="flex items-center justify-center p-8 bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 rounded-3">
                                <p className="text-xs font-poppins text-neutral-6">
                                    Aucun produit avec prix fournisseur défini sur cette période.
                                </p>
                            </div>
                        )}
                    </>
                ) : null}
            </div>

        </div>
    );
};

export default DashboardPage;