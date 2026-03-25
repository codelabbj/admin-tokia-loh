import React from 'react';
import { Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import ProductStatusToggle from '../products/ProductStatusToggle';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const VilleAvatar = ({ name }) => (
    <div className="w-9 h-9 rounded-md bg-secondary-5 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold font-poppins text-secondary-1 uppercase">
            {name?.slice(0, 2) ?? '??'}
        </span>
    </div>
);

/*
  Props :
  - villes   : tableau issu de useVilles()
  - loading  : boolean
  - onEdit   : (ville) => void
  - onDelete : (ville) => void
  - onToggle : (ville) => void  — toggle is_active
*/
const VillesTable = ({ villes = [], loading = false, onEdit, onDelete, onToggle }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-xs font-poppins">
                    <thead>
                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                            {['Ville', 'Frais de livraison', 'Statut', 'Actions'].map(col => (
                                <th key={col} className="text-left px-5 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-12 text-center">
                                    <Loader2 size={20} className="animate-spin text-primary-1 mx-auto" />
                                </td>
                            </tr>
                        ) : villes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-10 text-center text-neutral-6">
                                    Aucune ville configurée
                                </td>
                            </tr>
                        ) : villes.map(ville => (
                            <tr
                                key={ville.id}
                                onClick={() => navigate(`/cities/${ville.id}`)}
                                className="border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors duration-150 cursor-pointer"
                            >
                                {/* Ville */}
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <VilleAvatar name={ville.name} />
                                        <span className="font-semibold text-neutral-8 dark:text-neutral-8">
                                            {ville.name}
                                        </span>
                                    </div>
                                </td>

                                {/* Frais — champ API : delivery_price */}
                                <td className="px-5 py-3">
                                    {Number(ville.delivery_price) === 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-success-2 text-success-1 font-semibold text-[11px]">
                                            Gratuit
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-neutral-8 dark:text-neutral-8">
                                            {formatPrice(ville.delivery_price)}
                                        </span>
                                    )}
                                </td>

                                {/* Toggle statut — champ API : is_active */}
                                <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                    <ProductStatusToggle
                                        active={ville.is_active !== false}
                                        onChange={() => onToggle?.(ville)}
                                    />
                                </td>

                                {/* Actions */}
                                <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => navigate(`/cities/${ville.id}`)}
                                            title="Voir le détail"
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-secondary-5 hover:text-secondary-1 transition-colors cursor-pointer"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        <button
                                            onClick={() => onEdit?.(ville)}
                                            title="Modifier"
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-primary-5 hover:text-primary-1 transition-colors cursor-pointer"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => onDelete?.(ville)}
                                            title="Supprimer"
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VillesTable;