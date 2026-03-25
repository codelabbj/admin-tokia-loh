import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, TrendingUp, Package, Users
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import StatCard from '../components/dashboard/StatCard';
import RecentOrders from '../components/dashboard/RecentOrders';
import LowStockList from '../components/dashboard/LowStockList';
import SalesChart from '../components/dashboard/SalesChart';
import TopCities from '../components/dashboard/TopCities';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';

const formatCFA = (amount) =>
    amount != null ? `${Number(amount).toLocaleString('fr-FR')} F` : '— F';

const DashboardPage = () => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [dashParams, setDashParams] = useState({});
    // Dates appliquées — gardées pour les afficher dans le filtre
    const [appliedStart, setAppliedStart] = useState('');
    const [appliedEnd, setAppliedEnd] = useState('');

    const { stats, loading, error } = useDashboard(dashParams);

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
        setAppliedStart(start);   // garde les dates en YYYY-MM-DD pour les inputs
        setAppliedEnd(end);
        setDashParams({ start_date: toApi(start), end_date: toApi(end) });
    };

    // ── Squelette chargement ──────────────────────────────────
    if (loading) return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-8 w-48 bg-neutral-3 rounded-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-28 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
                ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 h-72 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
                <div className="h-72 bg-neutral-3 dark:bg-neutral-3 rounded-3" />
            </div>
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
                    value={stats?.products_sold?.toLocaleString('fr-FR') ?? '—'}
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

            {/* ── Graphique + Top villes ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <SalesChart data={stats?.sales_chart ?? []} />
                </div>
                <div>
                    <TopCities data={stats?.top_cities ?? []} />
                </div>
            </div>

            {/* ── Commandes récentes + Ruptures ── */}
            {/* Ces données ne sont pas sur /dashboard-rapport — */}
            {/* elles viendront de /dashboard-orders/ et /dashboard-product/ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                    <RecentOrders orders={stats?.recent_orders ?? []} />
                </div>
                <div>
                    <LowStockList products={stats?.low_stock ?? []} />
                </div>
            </div>

        </div>
    );
};

export default DashboardPage;