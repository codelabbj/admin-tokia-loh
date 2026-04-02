import React from 'react';
import { X, User, Phone, MapPin, Calendar, ShoppingCart, TrendingUp, PauseCircle } from 'lucide-react';
import Button from '../Button';
import ClientStatusBadge from './ClientStatusBadge';
import OrderStatusBadge from '../orders/OrderStatusBadge';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const ClientDetailModal = ({ open, onClose, client, onDisable }) => {
    if (!open || !client) return null;

    const totalSpent = client.orders?.reduce((acc, o) => acc + o.total, 0) ?? 0;
    const totalOrders = client.orders?.length ?? 0;
    const delivered = client.orders?.filter(o => o.status === 'Livrée').length ?? 0;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-neutral-8/40 dark:bg-neutral-2/60 z-40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="
                    bg-neutral-0 dark:bg-neutral-0
                    rounded-3 shadow-xl
                    w-full max-w-2xl max-h-[92vh]
                    flex flex-col overflow-hidden
                ">
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-4 dark:border-neutral-4 shrink-0">
                        <div className="flex items-center gap-3">
                            {/* Avatar initiales */}
                            <div className="w-10 h-10 rounded-full bg-primary-5 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold font-poppins text-primary-1">
                                    {client.firstName[0]}{client.lastName[0]}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                    {client.firstName} {client.lastName}
                                </h2>
                                <ClientStatusBadge status={client.status} />
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 dark:hover:bg-neutral-3 text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* ── Body scrollable ── */}
                    <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">

                        {/* Infos client */}
                        <div className="flex flex-col gap-3">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                Informations
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { icon: <User size={14} />, label: 'Nom', value: `${client.firstName} ${client.lastName}` },
                                    { icon: <Phone size={14} />, label: 'Téléphone', value: client.phone },
                                    { icon: <MapPin size={14} />, label: 'Ville', value: client.city },
                                    { icon: <Calendar size={14} />, label: 'Inscrit le', value: client.registeredAt },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} className="flex items-start gap-2 bg-neutral-2 dark:bg-neutral-2 rounded-2 px-3 py-2.5">
                                        <span className="text-primary-1 mt-0.5 shrink-0">{icon}</span>
                                        <div className="min-w-0">
                                            <p className="text-[11px] text-neutral-6 font-poppins">{label}</p>
                                            <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8 truncate">
                                                {value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stats rapides */}
                        <div className="flex flex-col gap-3">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                Activité
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1 bg-primary-5 dark:bg-primary-5 rounded-2 px-4 py-3">
                                    <span className="text-[11px] font-poppins text-primary-7">Total commandes</span>
                                    <span className="text-xl font-bold font-poppins text-primary-1">{totalOrders}</span>
                                </div>
                                <div className="flex flex-col gap-1 bg-success-2 rounded-2 px-4 py-3">
                                    <span className="text-[11px] font-poppins text-success-dark">Livrées</span>
                                    <span className="text-xl font-bold font-poppins text-success-1">{delivered}</span>
                                </div>
                                <div className="flex flex-col gap-1 bg-secondary-5 dark:bg-secondary-5 rounded-2 px-4 py-3">
                                    <span className="text-[11px] font-poppins text-secondary-7">Total dépensé</span>
                                    <span className="text-sm font-bold font-poppins text-secondary-1 truncate">{formatPrice(totalSpent)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Historique commandes */}
                        <div className="flex flex-col gap-3">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                Historique des commandes
                            </p>

                            {totalOrders === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-8 text-neutral-5">
                                    <ShoppingCart size={32} />
                                    <p className="text-xs font-poppins">Aucune commande pour ce client</p>
                                </div>
                            ) : (
                                <div className="border border-neutral-4 dark:border-neutral-4 rounded-2 overflow-hidden">
                                    <table className="w-full text-xs font-poppins">
                                        <thead>
                                            <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                                                {['N° Commande', 'Articles', 'Total', 'Statut', 'Date'].map(col => (
                                                    <th key={col} className="text-left px-4 py-2.5 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {client.orders.map((order, i) => (
                                                <tr key={i} className="border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors">
                                                    <td className="px-4 py-3 font-semibold text-primary-1">{order.id}</td>
                                                    <td className="px-4 py-3 text-neutral-6 dark:text-neutral-6">
                                                        {order.itemsCount} article{order.itemsCount > 1 ? 's' : ''}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-neutral-8 dark:text-neutral-8">
                                                        {formatPrice(order.total)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <OrderStatusBadge status={order.status} />
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-6 dark:text-neutral-6 whitespace-nowrap">
                                                        {order.date}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Footer : actions ── */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-4 dark:border-neutral-4 shrink-0 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                            {client.status !== 'Désactivé' && (
                                <Button
                                    variant="dangerOutline"
                                    size="sm"
                                    icon={<PauseCircle size={14} />}
                                    onClick={() => onDisable?.(client)}
                                >
                                    Désactiver le client
                                </Button>
                            )}
                        </div>

                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Fermer
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClientDetailModal;