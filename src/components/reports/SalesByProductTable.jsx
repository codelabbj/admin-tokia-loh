import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const RANK_STYLES = [
    'bg-warning-2 text-warning-1',
    'bg-neutral-3 text-neutral-6',
    'bg-neutral-2 text-neutral-5',
];

const TrendIcon = ({ trend }) => {
    if (trend === 'up') return <TrendingUp size={13} className="text-success-1" />;
    if (trend === 'down') return <TrendingDown size={13} className="text-danger-1" />;
    return <Minus size={13} className="text-neutral-5" />;
};

const ProductAvatar = ({ name }) => (
    <div className="w-8 h-8 rounded-lg bg-secondary-5 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold font-poppins text-secondary-1 uppercase">
            {name.slice(0, 2)}
        </span>
    </div>
);

/**
 * SalesByProductTable
 * @param {{ data: { rank, name, category, qty, ca, trend }[] }} props
 */
const SalesByProductTable = ({ data = [] }) => {
    if (data.length === 0) return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4
            rounded-3 flex items-center justify-center h-48 text-neutral-5">
            <p className="text-xs font-poppins">Aucun produit pour cette période</p>
        </div>
    );

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-4 dark:border-neutral-4">
                <h2 className="text-sm font-semibold font-poppins text-neutral-8 dark:text-neutral-8">
                    Top produits vendus
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs font-poppins">
                    <thead>
                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                            {['#', 'Produit', 'Qté vendue', 'CA généré'].map(col => (
                                <th key={col} className="text-left px-5 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr key={row.rank} className="border-b border-neutral-4 dark:border-neutral-4 last:border-0
                                hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors">
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full
                                        text-[11px] font-bold font-poppins
                                        ${RANK_STYLES[row.rank - 1] ?? 'bg-neutral-2 text-neutral-5'}`}>
                                        {row.rank}
                                    </span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <ProductAvatar name={row.name} />
                                        <span className="font-medium text-neutral-8 dark:text-neutral-8 whitespace-nowrap">
                                            {row.name}
                                        </span>
                                    </div>
                                </td>
                                {/* <td className="px-5 py-3 text-neutral-6 dark:text-neutral-6 whitespace-nowrap">
                                    {row.category}
                                </td> */}
                                <td className="px-5 py-3 font-semibold text-neutral-8 dark:text-neutral-8">
                                    {row.qty} unité{row.qty > 1 ? 's' : ''}
                                </td>
                                <td className="px-5 py-3 font-semibold text-primary-1 whitespace-nowrap">
                                    {formatPrice(row.ca)}
                                </td>
                                {/* <td className="px-5 py-3">
                                    <TrendIcon trend={row.trend} />
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesByProductTable;