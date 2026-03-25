import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, FileText, Truck,
    MessageSquare, User, MapPin, Phone, Loader2
} from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import Button from '../components/Button';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import OrderStatusStepper from '../components/orders/OrderStatusStepper';
import { generateInvoice, generateDeliveryNote } from '../components/orders/OrderPDFGenerator';
import OrderMap from '../components/orders/OrderMap';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const InfoCard = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 bg-neutral-2 dark:bg-neutral-2 rounded-2 px-3 py-2.5">
        <span className="text-primary-1 shrink-0">{icon}</span>
        <div>
            <p className="text-[11px] font-poppins text-neutral-6">{label}</p>
            <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">{value ?? '—'}</p>
        </div>
    </div>
);

const OrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { orders, loading, updateStatus } = useOrders();

    // Cherche la commande dans la liste déjà chargée
    const order = useMemo(() =>
        orders.find(o => o.id === id) ?? null,
        [orders, id]);

    useEffect(() => {
        if (order) document.title = `Admin Tokia-Loh | Commande #${id}`;
    }, [order, id]);

    useEffect(() => {
        if (!loading && orders.length > 0 && !order)
            navigate('/orders', { replace: true });
    }, [loading, orders, order, navigate]);

    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary-1" />
        </div>
    );

    if (!order) return null;

    const subtotal = order.items?.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0) ?? 0;
    const delivery = order.delivery_fee ?? 0;
    const total = subtotal + delivery;
    const orderForPDF = {
        ...order,
        // Adapte pour OrderPDFGenerator qui attend certains champs
        id: `#${id}`,
        date: order.date,
        deliveryFee: delivery,
        subtotal,
        total,
    };

    const handleStatusChange = (newStatus) => {
        updateStatus(order.id, newStatus);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-3 dark:hover:bg-neutral-3 text-neutral-6 hover:text-neutral-8 transition-colors cursor-pointer">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                Commande #{id}
                            </h1>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-xs font-poppins text-neutral-6 mt-0.5">
                            Passée le {formatDate(order.date)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="normal" onClick={() => generateInvoice(orderForPDF)}>
                        <FileText size={14} /> Facture PDF
                    </Button>
                    <Button variant="outlineSecondary" size="normal" onClick={() => generateDeliveryNote(orderForPDF)}>
                        <Truck size={14} /> Bon de livraison
                    </Button>
                </div>
            </div>

            {/* ── Layout 2 colonnes ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                {/* Colonne principale */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* Stepper */}
                    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 p-5 flex flex-col gap-3">
                        <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                            Statut de la commande
                        </p>
                        <OrderStatusStepper status={order.status} onStatusChange={handleStatusChange} />
                    </div>

                    {/* Produits */}
                    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
                        <div className="px-5 py-4 border-b border-neutral-4 dark:border-neutral-4">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                Produits commandés
                            </p>
                        </div>
                        <table className="w-full text-xs font-poppins">
                            <thead>
                                <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                                    {['Produit', 'Qté', 'Prix unitaire', 'Total'].map(col => (
                                        <th key={col} className="text-left px-4 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {console.log(order)}
                                {
                                    order.items?.map((item, i) => (
                                        <tr key={i} className="border-b border-neutral-4 dark:border-neutral-4 last:border-0">
                                            <td className="px-4 py-3 font-medium text-neutral-8 dark:text-neutral-8">{item.name}</td>
                                            <td className="px-4 py-3 text-center text-neutral-7 dark:text-neutral-7">{item.quantity}</td>
                                            <td className="px-4 py-3 text-neutral-7 dark:text-neutral-7">{formatPrice(item.unitPrice)}</td>
                                            <td className="px-4 py-3 font-semibold text-neutral-8 dark:text-neutral-8">{formatPrice(item.quantity * item.unitPrice)}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <div className="border-t border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2 px-5 py-3 flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs font-poppins text-neutral-6">
                                <span>Sous-total</span><span>{formatPrice(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-poppins text-neutral-6">
                                <span>Frais de livraison</span>
                                <span>{delivery > 0 ? formatPrice(delivery) : 'Gratuit'}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold font-poppins pt-2 border-t border-neutral-4 dark:border-neutral-4 text-neutral-8 dark:text-neutral-8">
                                <span>Total</span>
                                <span className="text-primary-1">{formatPrice(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Note client */}
                    {order.note && (
                        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 p-5 flex flex-col gap-3">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Note du client</p>
                            <div className="flex items-start gap-2 bg-secondary-5 dark:bg-secondary-5 border border-secondary-3 rounded-2 px-4 py-3">
                                <MessageSquare size={14} className="text-secondary-1 shrink-0 mt-0.5" />
                                <p className="text-xs font-poppins text-neutral-8 dark:text-neutral-8 italic">"{order.note}"</p>
                            </div>
                        </div>
                    )}

                    {/* Carte */}
                    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
                        <OrderMap client={order.client} orderId={order.id} />
                    </div>
                </div>

                {/* Colonne latérale */}
                <div className="flex flex-col gap-4">

                    {/* Infos client */}
                    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 p-5 flex flex-col gap-3">
                        <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Client</p>
                        <div className="flex flex-col gap-2">
                            <InfoCard icon={<User size={14} />} label="Nom complet" value={`${order.client?.fullName ?? ''} ${order.client?.last_name ?? ''}`} />
                            <InfoCard icon={<Phone size={14} />} label="Téléphone" value={order.client?.phone} />
                            <InfoCard icon={<MapPin size={14} />} label="Ville" value={order.client?.city} />
                        </div>
                    </div>

                    {/* Récap */}
                    <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 p-5 flex flex-col gap-3">
                        <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">Récapitulatif</p>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-xs font-poppins text-neutral-6">
                                <span>N° commande</span>
                                <span className="font-semibold text-primary-1">{order.reference}</span>
                            </div>
                            <div className="flex justify-between text-xs font-poppins text-neutral-6">
                                <span>Articles</span>
                                <span className="font-semibold text-neutral-8 dark:text-neutral-8">
                                    {order.items?.length} article{order.items?.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs font-poppins text-neutral-6">
                                <span>Date</span>
                                <span className="font-semibold text-neutral-8 dark:text-neutral-8">
                                    {formatDate(order.date)}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-neutral-4 dark:border-neutral-4 flex justify-between text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                <span>Total</span>
                                <span className="text-primary-1">{formatPrice(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;