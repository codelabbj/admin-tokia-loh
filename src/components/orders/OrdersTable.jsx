import React, { useState, useMemo } from 'react';
import { Search, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import OrderStatusBadge, { STATUS_CONFIG } from './OrderStatusBadge';

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
*/
const OrdersTable = ({ orders = [], loading = false, onStatusChange }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const filtered = useMemo(() => {
        return orders.filter(o => {
            const matchTab = activeTab === 'all' || o.status === activeTab;
            const clientName = `${o.client?.firstName ?? ''} ${o.client?.lastName ?? ''}`;
            const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
                clientName.toLowerCase().includes(search.toLowerCase());
            return matchTab && matchSearch;
        });
    }, [orders, search, activeTab]);

    const countByStatus = useMemo(() => {
        const map = { all: orders.length };
        Object.keys(STATUS_CONFIG).forEach(s => {
            map[s] = orders.filter(o => o.status === s).length;
        });
        return map;
    }, [orders]);

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">

            {/* ── Recherche ── */}
            <div className="px-5 pt-4 pb-3 border-b border-neutral-4 dark:border-neutral-4">
                <div className="relative max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-6 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Rechercher par N° ou client..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs font-poppins rounded-full bg-neutral-3 dark:bg-neutral-3 border border-transparent text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-6 outline-none focus:border-primary-1 focus:bg-neutral-0 dark:focus:bg-neutral-0 focus:ring-2 focus:ring-primary-5 transition-all duration-200"
                    />
                </div>
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
            <div className="overflow-x-auto">
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
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors duration-150 cursor-pointer"
                            >
                                <td className="px-4 py-3 font-semibold text-primary-1">
                                    {order.id?.slice(0, 8).toUpperCase()}
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
        </div>
    );
};

export default OrdersTable;