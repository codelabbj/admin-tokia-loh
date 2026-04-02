import React, { useState, useMemo, useId, useEffect, useRef } from 'react';
import { Search, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import OrderStatusBadge, { STATUS_CONFIG } from './OrderStatusBadge';

/** Filtre sur la page : référence API ou affichage avec # — comparaison en JS uniquement. */
function refMatchesQuery(orderRef, queryLower) {
    const ref = String(orderRef ?? '').toLowerCase().replace(/^#+/g, '').trim();
    const q = String(queryLower ?? '').replace(/^#+/g, '').trim();
    if (!q) return true;
    return ref.includes(q);
}

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const calcTotal = (order) => {
    const sub = order.items?.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0) ?? 0;
    return sub + (order.delivery_fee ?? 0);
};

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Onglets depuis les clés de STATUS_CONFIG
const STATUS_TABS = ['all', ...Object.keys(STATUS_CONFIG)];

const TAB_LABEL = { all: 'Toutes' };

/*
  Props :
  - orders         : tableau issu de useOrders()
  - loading        : boolean
  - onStatusChange : (orderId, newStatus) => void  — optionnel
  - statusStats    : { total, in_progress, delivered, canceled } | null — si null, badges onglets = page courante (orders)
  - pagination     : { page, totalPages, totalCount, pageSize, onPageChange } | null
*/
const OrdersTable = ({
    orders = [],
    loading = false,
    onStatusChange,
    statusStats = null,
    pagination = null,
    highlightRowId = '',
}) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const prevHighlightRef = useRef('');
    const searchInputId = useId();
    const searchHintId = useId();
    const tableRegionId = useId();
    const filterLiveId = useId();

    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (!highlightRowId) {
            prevHighlightRef.current = '';
            return;
        }
        if (highlightRowId === prevHighlightRef.current) return;
        prevHighlightRef.current = highlightRowId;
        setActiveTab('all');
        setSearch('');
    }, [highlightRowId]);

    const searchQ = search.trim().toLowerCase();

    const filtered = useMemo(() => {
        return orders.filter(o => {
            const matchTab = activeTab === 'all' || o.status === activeTab;

            const nameStr = `${o.client?.fullName ?? ''} ${o.client?.firstName ?? ''} ${o.client?.lastName ?? ''}`.trim().toLowerCase();
            const idStr = String(o.id ?? '').toLowerCase();
            const phoneStr = String(o.client?.phone ?? '').toLowerCase().replace(/\s/g, '');
            const qPhone = searchQ.replace(/\s/g, '');
            const cityStr = String(o.client?.city ?? '').toLowerCase();
            const itemsStr = (o.items ?? []).map(i => String(i.name ?? '')).join(' ').toLowerCase();

            const matchSearch = !searchQ ||
                idStr.includes(searchQ) ||
                refMatchesQuery(o.reference, searchQ) ||
                nameStr.includes(searchQ) ||
                (phoneStr && qPhone && phoneStr.includes(qPhone)) ||
                cityStr.includes(searchQ) ||
                itemsStr.includes(searchQ);
            return matchTab && matchSearch;
        });
    }, [orders, searchQ, activeTab]);

    const countByStatus = useMemo(() => {
        if (statusStats) {
            return {
                all: statusStats.total ?? 0,
                in_progress: statusStats.in_progress ?? 0,
                delivered: statusStats.delivered ?? 0,
                canceled: statusStats.canceled ?? 0,
            };
        }
        const map = { all: orders.length };
        Object.keys(STATUS_CONFIG).forEach(s => {
            map[s] = orders.filter(o => o.status === s).length;
        });
        return map;
    }, [statusStats, orders]);

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">

            {/* ── Recherche (filtrage local sur les lignes affichées) ── */}
            <div className="px-5 pt-4 pb-3 border-b border-neutral-4 dark:border-neutral-4 flex flex-wrap items-center gap-3 justify-between">
                <div className="relative max-w-sm flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-6 pointer-events-none" aria-hidden />
                    <input
                        id={searchInputId}
                        type="search"
                        role="searchbox"
                        aria-label="Filtrer les commandes de la page courante"
                        aria-describedby={searchHintId}
                        aria-controls={tableRegionId}
                        placeholder="Référence, client, n° commande, ville…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs font-poppins rounded-full bg-neutral-3 dark:bg-neutral-3 border border-transparent text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-6 outline-none focus:border-primary-1 focus:bg-neutral-0 dark:focus:bg-neutral-0 focus:ring-2 focus:ring-primary-5 transition-all duration-200"
                    />
                    <p id={searchHintId} className="sr-only">
                        Saisie filtrée en direct sur les commandes déjà chargées (page actuelle), sans requête serveur.
                    </p>
                    <p id={filterLiveId} className="sr-only" aria-live="polite" aria-atomic="true">
                        {!loading && `${filtered.length} commande${filtered.length > 1 ? 's' : ''} correspond${filtered.length > 1 ? 'ent' : ''} au filtre`}
                    </p>
                </div>
                {pagination && (
                    <span className="text-[11px] font-poppins text-neutral-6 whitespace-nowrap">
                        {filtered.length} affichée{filtered.length > 1 ? 's' : ''} · {pagination.totalCount} au total
                    </span>
                )}
            </div>

            {/* ── Onglets statut ── */}
            <div className="flex items-center overflow-x-auto border-b border-neutral-4 dark:border-neutral-4">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-xs font-poppins font-medium whitespace-nowrap border-b-2 transition-all duration-200 cursor-pointer ${activeTab === tab
                            ? 'border-primary-1 text-primary-1'
                            : 'border-transparent text-neutral-6 hover:text-neutral-8'
                            }`}
                    >
                        {TAB_LABEL[tab] ?? STATUS_CONFIG[tab]?.label ?? tab}
                        {countByStatus[tab] > 0 && (
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${activeTab === tab ? 'bg-primary-5 text-primary-1' : 'bg-neutral-3 text-neutral-6'}`}>
                                {countByStatus[tab]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tableau ── */}
            <div className="overflow-x-auto" id={tableRegionId} role="region" aria-label="Liste des commandes">
                <table className="w-full text-xs font-poppins">
                    <thead>
                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                            {['N° Commande', 'Client', 'Ville', 'Articles', 'Total', 'Statut', 'Date', ''].map(col => (
                                <th key={col} className="text-left px-4 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center">
                                    <Loader2 size={20} className="animate-spin text-primary-1 mx-auto" />
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-neutral-6">
                                    Aucune commande trouvée
                                </td>
                            </tr>
                        ) : filtered.map(order => (
                            <tr
                                key={order.id}
                                id={`order-row-${order.id}`}
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className={`border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors duration-150 cursor-pointer ${highlightRowId && String(order.id) === String(highlightRowId)
                                    ? 'ring-2 ring-inset ring-primary-1 bg-primary-5/25 dark:bg-primary-5/15'
                                    : ''}`}
                            >
                                <td className="px-4 py-3 font-semibold text-primary-1">
                                    {order.reference?.startsWith('#') ? order.reference : `#${order.reference}`}
                                </td>
                                <td className="px-4 py-3 text-neutral-8 dark:text-neutral-8 whitespace-nowrap">
                                    {order.client?.fullName || `${order.client?.firstName ?? ''} ${order.client?.lastName ?? ''}`.trim() || '—'}
                                </td>
                                <td className="px-4 py-3 text-neutral-6 whitespace-nowrap">
                                    {order.client?.city}
                                </td>
                                <td className="px-4 py-3 text-neutral-6">
                                    {order.items?.length} article{order.items?.length > 1 ? 's' : ''}
                                </td>
                                <td className="px-4 py-3 font-semibold text-neutral-8 dark:text-neutral-8 whitespace-nowrap">
                                    {formatPrice(calcTotal(order))}
                                </td>
                                <td className="px-4 py-3">
                                    <OrderStatusBadge status={order.status} />
                                </td>
                                <td className="px-4 py-3 text-neutral-6 whitespace-nowrap">
                                    {formatDate(order.date)}
                                </td>
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => navigate(`/orders/${order.id}`)}
                                        title="Voir le détail"
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-secondary-5 hover:text-secondary-1 transition-colors cursor-pointer"
                                    >
                                        <Eye size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.totalCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-neutral-4 dark:border-neutral-4 bg-neutral-2/50 dark:bg-neutral-2/50">
                    <p className="text-[11px] font-poppins text-neutral-6">
                        Page <span className="font-semibold text-neutral-8">{pagination.page}</span>
                        {' · '}
                        {pagination.totalPages} au total
                        {' · '}
                        {pagination.pageSize} par page
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={pagination.page <= 1 || loading}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-4 text-neutral-7 hover:bg-neutral-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Page précédente"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            disabled={pagination.page >= pagination.totalPages || loading}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-4 text-neutral-7 hover:bg-neutral-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Page suivante"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersTable;