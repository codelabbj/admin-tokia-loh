import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

// Correspondance statut API → label + couleur
const STATUS_MAP = {
    in_progress: {
        label: 'En cours',
        css: 'bg-primary-5 text-primary-1'
    },
    delivered: {
        label: 'Livrée',
        css: 'bg-success-2 text-success-1'
    },
    canceled: {
        label: 'Annulée',
        css: 'bg-danger-2 text-danger-1'
    },
};


const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] ?? { label: status, css: 'bg-neutral-3 text-neutral-6' };
    return (
        <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full
            text-[11px] font-semibold font-poppins whitespace-nowrap
            ${s.css}
        `}>
            {s.label}
        </span>
    );
};

const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatTotal = (amount) =>
    amount ? `${Number(amount).toLocaleString('fr-FR')} F` : '—';

/*
  Props :
  - orders : tableau issu de stats.recent_orders
    [{ id, client, total, status, created_at }]
*/
const RecentOrders = ({ orders = [] }) => {
    const navigate = useNavigate();

    return (
        <div className="
            bg-neutral-0 dark:bg-neutral-0
            border border-neutral-4 dark:border-neutral-4
            rounded-3 overflow-hidden
        ">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-4 dark:border-neutral-4">
                <h2 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                    Dernières commandes
                </h2>
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-1 text-xs font-poppins text-primary-1 hover:underline cursor-pointer"
                >
                    Voir toutes les commandes <ArrowRight size={13} />
                </button>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs font-poppins">
                    <thead>
                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                            {['N° Commande', 'Client', 'Total', 'Statut', 'Date'].map(col => (
                                <th key={col} className="text-left px-5 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-neutral-5 font-poppins">
                                    Aucune commande récente
                                </td>
                            </tr>
                        ) : orders.map(order => (
                            <tr
                                key={order.id}
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="
                                    border-b border-neutral-4 dark:border-neutral-4 last:border-0
                                    hover:bg-neutral-2 dark:hover:bg-neutral-2
                                    transition-colors duration-150 cursor-pointer
                                "
                            >
                                <td className="px-5 py-3 font-semibold text-primary-1">
                                    {order.reference}
                                </td>
                                <td className="px-5 py-3 text-neutral-8 dark:text-neutral-8 whitespace-nowrap">
                                    {order.client}
                                </td>
                                <td className="px-5 py-3 font-semibold text-neutral-8 dark:text-neutral-8 whitespace-nowrap">
                                    {formatTotal(order.total)}
                                </td>
                                <td className="px-5 py-3">
                                    <StatusBadge status={order.status} />
                                </td>
                                <td className="px-5 py-3 text-neutral-6 dark:text-neutral-6 whitespace-nowrap">
                                    {formatDate(order.created_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentOrders;