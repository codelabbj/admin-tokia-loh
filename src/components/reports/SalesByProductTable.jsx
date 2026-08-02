import React, { useState } from 'react';
import { PackageCheck, ChevronDown, ChevronRight } from 'lucide-react';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const formatDate = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const ProductAvatar = ({ name, image }) => {
    if (image) return (
        <img src={image} alt={name} className="w-7 h-7 rounded-md object-cover shrink-0" />
    );
    return (
        <div className="w-7 h-7 rounded-md bg-secondary-5 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold font-poppins text-secondary-1 uppercase">
                {(name ?? '??').slice(0, 2)}
            </span>
        </div>
    );
};

/**
 * SalesByProductTable — Top commandes livrées avec bénéfices
 *
 * @param {{
 *   data: {
 *     id: string,
 *     reference: string,
 *     clientName: string,
 *     date: string,
 *     total: number,
 *     totalCost: number | null,
 *     totalProfit: number | null,
 *     items: { productName, productImage, quantity, price, supplierPrice, profit }[]
 *   }[]
 * }} props
 */
const SalesByProductTable = ({ data = [] }) => {
    const [expandedRow, setExpandedRow] = useState(null);

    if (data.length === 0) return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4
            rounded-3 flex items-center justify-center h-48 text-neutral-5">
            <p className="text-xs font-poppins">Aucune commande livrée pour cette période</p>
        </div>
    );

    // Totaux globaux
    const totalCA = data.reduce((s, o) => s + o.total, 0);
    const totalCost = data.reduce((s, o) => s + (o.totalCost ?? 0), 0);
    const totalProfit = data.reduce((s, o) => s + (o.totalProfit ?? 0), 0);
    const marginPct = totalCA > 0 ? Math.round((totalProfit / totalCA) * 100) : 0;

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-4 dark:border-neutral-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                    <PackageCheck size={16} className="text-success-1" />
                    <h2 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                        Top commandes
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-success-2 text-success-1 text-[11px] font-bold font-poppins">
                        {data.length}
                    </span>
                </div>

                {/* Résumé global */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex flex-col items-end gap-0">
                        <span className="text-[10px] font-poppins text-neutral-5 uppercase tracking-wide">CA total</span>
                        <span className="text-xs font-bold font-poppins text-primary-1">{formatPrice(totalCA)}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0">
                        <span className="text-[10px] font-poppins text-neutral-5 uppercase tracking-wide">Coût total</span>
                        <span className="text-xs font-semibold font-poppins text-neutral-6">{totalCost > 0 ? formatPrice(totalCost) : '—'}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0">
                        <span className="text-[10px] font-poppins text-neutral-5 uppercase tracking-wide">Bénéfice total</span>
                        <span className={`text-xs font-bold font-poppins ${totalProfit >= 0 ? 'text-success-1' : 'text-danger-1'}`}>
                            {totalProfit >= 0 ? '+' : ''}{formatPrice(totalProfit)}
                            {totalCA > 0 && (
                                <span className="ml-1 text-[10px] font-normal opacity-70">({marginPct}%)</span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs font-poppins">
                    <thead>
                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                            {['', 'Référence', 'Client', 'Date', 'CA', 'Coût fournisseur', 'Bénéfice'].map(col => (
                                <th key={col} className="text-left px-4 py-3 text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((order) => {
                            const isExpanded = expandedRow === order.id;
                            const isPositive = (order.totalProfit ?? 0) >= 0;
                            const margin = order.total > 0 && order.totalProfit != null
                                ? Math.round((order.totalProfit / order.total) * 100)
                                : null;

                            return (
                                <React.Fragment key={order.id}>
                                    {/* Ligne commande */}
                                    <tr
                                        className="border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors cursor-pointer"
                                        onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                                    >
                                        {/* Expand toggle */}
                                        <td className="px-4 py-3 w-8">
                                            {isExpanded
                                                ? <ChevronDown size={14} className="text-neutral-6" />
                                                : <ChevronRight size={14} className="text-neutral-5" />
                                            }
                                        </td>

                                        {/* Référence */}
                                        <td className="px-4 py-3 font-mono text-[11px] text-neutral-8 whitespace-nowrap">
                                            #{order.reference}
                                        </td>

                                        {/* Client */}
                                        <td className="px-4 py-3 text-neutral-7 whitespace-nowrap">
                                            {order.clientName}
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3 text-neutral-5 whitespace-nowrap">
                                            {formatDate(order.date)}
                                        </td>

                                        {/* CA */}
                                        <td className="px-4 py-3 font-semibold text-primary-1 whitespace-nowrap">
                                            {formatPrice(order.total)}
                                        </td>

                                        {/* Coût fournisseur */}
                                        <td className="px-4 py-3 text-neutral-6 whitespace-nowrap">
                                            {order.totalCost != null
                                                ? formatPrice(order.totalCost)
                                                : <span className="text-neutral-4">—</span>
                                            }
                                        </td>

                                        {/* Bénéfice */}
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {order.totalProfit != null ? (
                                                <div className="flex flex-col gap-0">
                                                    <span className={`font-bold ${isPositive ? 'text-success-1' : 'text-danger-1'}`}>
                                                        {isPositive ? '+' : ''}{formatPrice(order.totalProfit)}
                                                    </span>
                                                    {margin != null && (
                                                        <span className={`text-[10px] font-semibold ${isPositive ? 'text-success-1' : 'text-danger-1'} opacity-60`}>
                                                            {margin}% marge
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-neutral-4 text-[11px]">—</span>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Détail produits (expanded) */}
                                    {isExpanded && (
                                        <tr className="border-b border-neutral-4 dark:border-neutral-4 bg-neutral-2/50 dark:bg-neutral-2/30">
                                            <td colSpan={7} className="px-6 py-3">
                                                <div className="flex flex-col gap-2">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-3 py-1.5 border-b border-neutral-4/60 last:border-0">
                                                            <ProductAvatar name={item.productName} image={item.productImage} />
                                                            <span className="font-medium text-neutral-8 flex-1 min-w-0 truncate">
                                                                {item.productName}
                                                            </span>
                                                            <span className="text-neutral-5 whitespace-nowrap">
                                                                {item.quantity} u. × {formatPrice(item.price)}
                                                            </span>
                                                            {item.supplierPrice != null && (
                                                                <span className="text-neutral-5 whitespace-nowrap">
                                                                    Fourn. {formatPrice(item.supplierPrice)}
                                                                </span>
                                                            )}
                                                            {item.profit != null && (
                                                                <span className={`font-semibold whitespace-nowrap ${item.profit >= 0 ? 'text-success-1' : 'text-danger-1'}`}>
                                                                    {item.profit >= 0 ? '+' : ''}{formatPrice(item.profit)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesByProductTable;
