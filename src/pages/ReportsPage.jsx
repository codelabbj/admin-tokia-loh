import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Package, BarChart2, Loader2, AlertCircle } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ReportFilters from '../components/reports/ReportFilters';
import SalesByCategoryChart from '../components/reports/SalesByCategoryChart';
import SalesByProductTable from '../components/reports/SalesByProductTable';
import ReportExporter from '../components/reports/ReportExporter';
import { useReports } from '../hooks/useReports';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

// Dates par défaut
const today = new Date().toISOString().slice(0, 10);
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

const ReportsPage = () => {
    const [period, setPeriod] = useState('month');
    const [dateFrom, setDateFrom] = useState(weekAgo);
    const [dateTo, setDateTo] = useState(today);

    const { report, products, loading, error, fetch } = useReports();

    // Chargement initial et à chaque changement de filtre
    useEffect(() => {
        document.title = 'Admin Tokia-Loh | Rapports';
        fetch({ period });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePeriodChange = (p) => {
        setPeriod(p);
        fetch({ period: p });
    };

    const handleDateChange = ({ from, to }) => {
        setDateFrom(from);
        setDateTo(to);
        if (from && to) {
            // Passe en mode plage personnalisée
            setPeriod(null);
            fetch({ dateFrom: from, dateTo: to });
        }
    };

    // ── États ─────────────────────────────────────────────────
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

    // Données prêtes (ou vides par défaut)
    const turnover = report?.turnover ?? 0;
    const totalOrders = report?.totalOrders ?? 0;
    const productsSold = report?.productsSold ?? 0;
    const averageBasket = report?.averageBasket ?? 0;
    const salesByCategory = report?.salesByCategory ?? [];

    // Données pour l'export PDF/CSV
    const exportCategories = salesByCategory.map(c => ({
        category: c.category,
        ca: c.ca,
        orders: c.orders,
    }));

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div>
                <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                    Rapports & Analytiques
                </h1>
                <p className="text-xs font-poppins text-neutral-6 dark:text-neutral-6 mt-0.5">
                    Analysez les performances de Tokia-Loh
                </p>
            </div>

            {/* ── Filtres ── */}
            <ReportFilters
                period={period}
                onPeriodChange={handlePeriodChange}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
            />

            {/* ── Stats ── */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Chiffre d'affaires"
                    value={formatPrice(turnover)}
                    icon={<TrendingUp size={18} />}
                    color="primary"
                />
                <StatCard
                    title="Commandes"
                    value={String(totalOrders)}
                    icon={<ShoppingCart size={18} />}
                    color="secondary"
                />
                <StatCard
                    title="Produits vendus"
                    value={String(productsSold)}
                    icon={<Package size={18} />}
                    color="success"
                />
                <StatCard
                    title="Panier moyen"
                    value={formatPrice(averageBasket)}
                    icon={<BarChart2 size={18} />}
                    color="warning"
                />
            </div>

            {/* ── Graphiques ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <SalesByCategoryChart data={salesByCategory} />
                <SalesByProductTable data={products} />
            </div>

            {/* ── Export ── */}
            <ReportExporter
                products={products}
                categories={exportCategories}
                period={period ?? 'custom'}
            />
        </div>
    );
};

export default ReportsPage;