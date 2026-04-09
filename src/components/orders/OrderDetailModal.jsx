import React, { useState, useMemo } from 'react';
import { X, FileText, Truck, MessageSquare, User, MapPin, Phone, AlertCircle } from 'lucide-react';
import Button from '../Button';
import OrderStatusBadge from './OrderStatusBadge';
import OrderStatusStepper from './OrderStatusStepper';
import { generateInvoice, generateDeliveryNote } from './OrderPDFGenerator';
import { resolveDeliveryFeeFromVilles } from '../../hooks/useOrders';
import { useVilles } from '../../hooks/useVilles';
import { useCompany } from '../../hooks/useCompany';
//import OrderMap from './OrderMapOld';
import OrderMap from './OrderMap';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const OrderDetailModal = ({ open, onClose, order, onStatusChange }) => {
    const [currentOrder, setCurrentOrder] = useState(order);
    const { villes } = useVilles();
    const { company } = useCompany();

    // Sync si l'order change depuis le parent
    React.useEffect(() => {
        setCurrentOrder(order);
    }, [order]);

    const subtotal = useMemo(() => {
        if (!currentOrder) return 0;
        return (
            currentOrder.items?.reduce(
                (acc, i) => acc + i.quantity * i.unitPrice,
                0,
            ) ?? 0
        );
    }, [currentOrder]);

    const delivery = useMemo(() => {
        if (!currentOrder) return 0;
        return resolveDeliveryFeeFromVilles(
            currentOrder,
            villes,
            currentOrder.delivery_fee ?? currentOrder.deliveryFee,
        );
    }, [currentOrder, villes]);

    if (!open || !currentOrder) return null;

    const handleStatusChange = (newStatus, cancellationReason) => {
        const updated = { ...currentOrder, status: newStatus, ...(newStatus === 'canceled' && { cancellation_reason: cancellationReason ?? null }) };
        setCurrentOrder(updated);
        onStatusChange?.(currentOrder.id, newStatus, cancellationReason);
    };

    const orderForPDF = {
        ...currentOrder,
        subtotal,
        deliveryFee: delivery,
        total: subtotal + delivery,
        company: company ?? undefined,
    };

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
                            <h2 className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">
                                Commande {currentOrder.id}
                            </h2>
                            <OrderStatusBadge status={currentOrder.status} />
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

                        {/* Stepper statut */}
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                Statut de la commande
                            </p>
                            <OrderStatusStepper
                                status={currentOrder.status}
                                onStatusChange={handleStatusChange}
                            />
                        </div>

                        {/* Infos client */}
                        <div className="flex flex-col gap-3">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                Client
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="flex items-center gap-2 bg-neutral-2 dark:bg-neutral-2 rounded-2 px-3 py-2.5">
                                    <User size={14} className="text-primary-1 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-neutral-6 font-poppins">Nom</p>
                                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                            {currentOrder.client.firstName} {currentOrder.client.lastName}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-neutral-2 dark:bg-neutral-2 rounded-2 px-3 py-2.5">
                                    <Phone size={14} className="text-primary-1 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-neutral-6 font-poppins">Téléphone</p>
                                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                            {currentOrder.client.phone}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-neutral-2 dark:bg-neutral-2 rounded-2 px-3 py-2.5">
                                    <MapPin size={14} className="text-primary-1 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-neutral-6 font-poppins">Ville</p>
                                        <p className="text-xs font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                                            {currentOrder.client.city}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Produits */}
                        <div className="flex flex-col gap-3">
                            <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                Produits commandés
                            </p>
                            <div className="border border-neutral-4 dark:border-neutral-4 rounded-2 overflow-hidden">
                                <table className="w-full text-xs font-poppins">
                                    <thead>
                                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                                            {['Produit', 'Qté', 'Prix unitaire', 'Total'].map(col => (
                                                <th key={col} className="text-left px-4 py-2.5 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentOrder.items?.map((item, i) => (
                                            <tr key={i} className="border-b border-neutral-4 dark:border-neutral-4 last:border-0">
                                                <td className="px-4 py-3 text-neutral-8 dark:text-neutral-8 font-medium">
                                                    {item.name}
                                                </td>
                                                <td className="px-4 py-3 text-center text-neutral-7 dark:text-neutral-7">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-neutral-7 dark:text-neutral-7">
                                                    {formatPrice(item.unitPrice)}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-neutral-8 dark:text-neutral-8">
                                                    {formatPrice(item.quantity * item.unitPrice)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Totaux */}
                                <div className="border-t border-neutral-4 dark:border-neutral-4 bg-neutral-2 dark:bg-neutral-2 px-4 py-3 flex flex-col gap-1.5">
                                    <div className="flex justify-between text-xs font-poppins text-neutral-6">
                                        <span>Sous-total</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-poppins text-neutral-6">
                                        <span>Frais de livraison</span>
                                        <span>{delivery > 0 ? formatPrice(delivery) : 'Gratuit'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8 pt-1 border-t border-neutral-4 dark:border-neutral-4">
                                        <span>Total</span>
                                        <span className="text-primary-1">{formatPrice(subtotal + delivery)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Note du client */}
                        {currentOrder.note && (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                    Note du client
                                </p>
                                <div className="flex items-start gap-2 bg-secondary-5 dark:bg-secondary-5 border border-secondary-3 rounded-2 px-4 py-3">
                                    <MessageSquare size={14} className="text-secondary-1 shrink-0 mt-0.5" />
                                    <p className="text-xs font-poppins text-neutral-8 dark:text-neutral-8 italic">
                                        "{currentOrder.note}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Raison d'annulation */}
                        {currentOrder.status === 'canceled' && (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-semibold font-poppins text-neutral-6 uppercase tracking-wide">
                                    Raison d'annulation
                                </p>
                                <div className="flex items-start gap-2 bg-danger-2 border border-danger-1/30 rounded-2 px-4 py-3">
                                    <AlertCircle size={14} className="text-danger-1 shrink-0 mt-0.5" />
                                    <p className="text-xs font-poppins text-danger-1 italic">
                                        {currentOrder.cancellation_reason
                                            ? `"${currentOrder.cancellation_reason}"`
                                            : 'Aucune raison renseignée.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Carte de localisation */}
                        <OrderMap client={currentOrder.client} orderId={currentOrder.id} />

                        {/* Date */}
                        <p className="text-[11px] font-poppins text-neutral-5">
                            Commande passée le {currentOrder.date}
                        </p>
                    </div>

                    {/* ── Footer : PDF ── */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-4 dark:border-neutral-4 shrink-0 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                icon={<FileText size={14} />}
                                onClick={() => void generateInvoice(orderForPDF)}
                            >
                                Facture PDF
                            </Button>
                            <Button
                                variant="outlineSecondary"
                                size="sm"
                                icon={<Truck size={14} />}
                                onClick={() => void generateDeliveryNote(orderForPDF)}
                            >
                                Bon de livraison
                            </Button>
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

export default OrderDetailModal;