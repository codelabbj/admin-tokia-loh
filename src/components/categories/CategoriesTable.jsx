import React from 'react';
import { Pencil, Trash2, Eye, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import ProductStatusToggle from '../products/ProductStatusToggle';

const CategoryAvatar = ({ name, icon }) => {
    if (icon) return (
        <img src={icon} alt={name} className="w-9 h-9 rounded-md object-cover shrink-0" />
    );
    return (
        <div className="w-9 h-9 rounded-md bg-primary-5 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold font-poppins text-primary-1 uppercase">
                {name?.slice(0, 2) ?? '??'}
            </span>
        </div>
    );
};

/*
  Props :
  - categories        : tableau issu de useCategories() ou useCategoriesList()
  - loading           : boolean
  - productCountByCat : { [catId]: number } — nb produits par catégorie (fallback si pas products_count API)
  - onEdit            : (category) => void
  - onDelete          : (category) => void
  - onUpdate          : (id, payload) => Promise — pour toggle statut
  - serverFilters     : { search, onSearchChange } | null — recherche côté API
  - pagination        : { page, totalPages, totalCount, pageSize, onPageChange } | null
*/
const CategoriesTable = ({
    categories = [],
    loading = false,
    productCountByCat = {},
    onEdit,
    onDelete,
    onUpdate,
    serverFilters = null,
    pagination = null,
}) => {
    const navigate = useNavigate();

    const handleToggle = (cat) => {
        onUpdate?.(cat.id, { is_active: !cat.is_active });
    };

    const rowCount = categories.length;

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
            {serverFilters && (
                <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-neutral-4 dark:border-neutral-4">
                    <div className="relative flex-1 min-w-48">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-6 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Rechercher une catégorie..."
                            value={serverFilters.search}
                            onChange={e => serverFilters.onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-poppins rounded-full bg-neutral-3 dark:bg-neutral-3 border border-transparent text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-6 outline-none focus:border-primary-1 focus:bg-neutral-0 dark:focus:bg-neutral-0 focus:ring-2 focus:ring-primary-5 transition-all duration-200"
                        />
                    </div>
                    <span className="text-[11px] font-poppins text-neutral-6 whitespace-nowrap ml-auto">
                        {pagination
                            ? `${rowCount} affichée${rowCount > 1 ? 's' : ''} · ${pagination.totalCount} au total`
                            : `${rowCount} catégorie${rowCount > 1 ? 's' : ''}`}
                    </span>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-xs font-poppins">
                    <thead>
                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                            {['Catégorie', 'Description', 'Produits', 'Statut', 'Actions'].map(col => (
                                <th key={col} className="text-left px-5 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center">
                                    <Loader2 size={20} className="animate-spin text-primary-1 mx-auto" />
                                </td>
                            </tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-10 text-center text-neutral-6">
                                    Aucune catégorie
                                </td>
                            </tr>
                        ) : categories.map((cat) => {
                            const productCount = productCountByCat[cat.id] ?? cat.products_count ?? 0;
                            return (
                                <tr
                                    key={cat.id}
                                    onClick={() => navigate(`/categories/${cat.id}`)}
                                    className="border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors duration-150 cursor-pointer"
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <CategoryAvatar name={cat.name} icon={cat.icon} />
                                            <span className="font-semibold text-neutral-8 dark:text-neutral-8">
                                                {cat.name}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-5 py-3 text-neutral-6 dark:text-neutral-6 max-w-55 truncate">
                                        {cat.description || '—'}
                                    </td>

                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-5 text-primary-1 font-semibold text-[11px] w-max">
                                            {productCount} produit{productCount > 1 ? 's' : ''}
                                        </span>
                                    </td>

                                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                        <ProductStatusToggle
                                            active={cat.is_active}
                                            onChange={() => handleToggle(cat)}
                                        />
                                    </td>

                                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => navigate(`/categories/${cat.id}`)}
                                                title="Voir le détail"
                                                className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-secondary-5 hover:text-secondary-1 transition-colors cursor-pointer"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => onEdit?.(cat)}
                                                title="Modifier"
                                                className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-primary-5 hover:text-primary-1 transition-colors cursor-pointer"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDelete?.(cat)}
                                                title="Supprimer"
                                                className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-danger-2 hover:text-danger-1 transition-colors cursor-pointer"
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

export default CategoriesTable;
