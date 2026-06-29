import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, Eye, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import ProductStatusToggle from '../products/ProductStatusToggle';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;

const EMPTY_CITY_KEYS = new Set();

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
  - ordersLoading       : boolean — tant que les commandes chargent, suppression désactivée (prudence)
  - cityKeysWithOrders  : Set<string> — clés ville en lower case ayant au moins une commande
  - onEdit   : (ville) => void
  - onDelete : (ville) => void
  - onToggle : (ville) => void  — toggle is_active
*/
const VillesTable = ({
    villes = [],
    loading = false,
    ordersLoading = false,
    cityKeysWithOrders = EMPTY_CITY_KEYS,
    onEdit,
    onDelete,
    onToggle,
}) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return villes;
        return villes.filter((v) =>
            String(v.name ?? '').toLowerCase().includes(q),
        );
    }, [villes, search]);

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-md overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-neutral-4 dark:border-neutral-4">
                <div className="relative flex-1 min-w-48 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-6 pointer-events-none" />
                    <input
                        type="search"
                        placeholder="Rechercher une ville…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs font-poppins rounded-full bg-neutral-3 dark:bg-neutral-3 border border-transparent text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-6 outline-none focus:border-primary-1 focus:bg-neutral-0 dark:focus:bg-neutral-0 focus:ring-2 focus:ring-primary-5 transition-all duration-200"
                    />
                </div>
                {search.trim() && (
                    <span className="text-[11px] font-poppins text-neutral-6 whitespace-nowrap ml-auto">
                        {filtered.length} résultat{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>
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
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-10 text-center text-neutral-6">
                                    Aucune ville ne correspond à votre recherche
                                </td>
                            </tr>
                        ) : filtered.map((ville) => {
                            const hasOrders =
                                cityKeysWithOrders.has(
                                    String(ville.name ?? '').toLowerCase(),
                                );
                            const deleteDisabled = ordersLoading || hasOrders;
                            return (
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
                                            type="button"
                                            disabled={deleteDisabled}
                                            onClick={() =>
                                                !deleteDisabled && onDelete?.(ville)
                                            }
                                            title={
                                                ordersLoading
                                                    ? 'Chargement des commandes…'
                                                    : hasOrders
                                                      ? 'Suppression impossible : commandes liées à cette ville'
                                                      : 'Supprimer'
                                            }
                                            className="
                                                w-7 h-7 flex items-center justify-center rounded-md transition-colors
                                                text-neutral-6
                                                enabled:hover:bg-danger-2 enabled:hover:text-danger-1 enabled:cursor-pointer
                                                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                                            "
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VillesTable;