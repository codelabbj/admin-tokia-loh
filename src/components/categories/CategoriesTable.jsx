import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, ChevronUp, ChevronDown, Eye, Loader2 } from 'lucide-react';
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
  - categories        : tableau issu de useCategories()
  - loading           : boolean
  - productCountByCat : { [catId]: number } — nb produits par catégorie
  - onEdit            : (category) => void
  - onDelete          : (category) => void
  - onUpdate          : (id, payload) => Promise — pour toggle statut + réordonnancement
*/
const CategoriesTable = ({
    categories = [],
    loading = false,
    productCountByCat = {},
    onEdit,
    onDelete,
    onUpdate,
}) => {
    const navigate = useNavigate();

    // Liste locale triée par order pour permettre le réordonnancement optimiste
    const [sorted, setSorted] = useState([]);

    useEffect(() => {
        setSorted([...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }, [categories]);

    const handleToggle = (cat) => {
        onUpdate?.(cat.id, { is_active: !cat.is_active });
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const updated = [...sorted];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        const reordered = updated.map((c, i) => ({ ...c, order: i + 1 }));
        setSorted(reordered);
        // TODO : appel API PATCH /categories/reorder avec le nouvel ordre
        reordered.forEach(c => onUpdate?.(c.id, { order: c.order }));
    };

    const moveDown = (index) => {
        if (index === sorted.length - 1) return;
        const updated = [...sorted];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        const reordered = updated.map((c, i) => ({ ...c, order: i + 1 }));
        setSorted(reordered);
        reordered.forEach(c => onUpdate?.(c.id, { order: c.order }));
    };

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-xs font-poppins">
                    <thead>
                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                            {['Ordre', 'Catégorie', 'Description', 'Produits', 'Statut', 'Actions'].map(col => (
                                <th key={col} className="text-left px-5 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-12 text-center">
                                    <Loader2 size={20} className="animate-spin text-primary-1 mx-auto" />
                                </td>
                            </tr>
                        ) : sorted.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-neutral-6">
                                    Aucune catégorie
                                </td>
                            </tr>
                        ) : sorted.map((cat, index) => {
                            const productCount = productCountByCat[cat.id] ?? cat.products_count ?? 0;
                            return (
                                <tr
                                    key={cat.id}
                                    onClick={() => navigate(`/categories/${cat.id}`)}
                                    className="border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors duration-150 cursor-pointer"
                                >
                                    {/* Ordre */}
                                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-6 text-center font-bold text-neutral-5">
                                                {cat.order ?? index + 1}
                                            </span>
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => moveUp(index)}
                                                    disabled={index === 0}
                                                    className="w-5 h-5 flex items-center justify-center rounded text-neutral-5 hover:text-primary-1 hover:bg-primary-5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                >
                                                    <ChevronUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => moveDown(index)}
                                                    disabled={index === sorted.length - 1}
                                                    className="w-5 h-5 flex items-center justify-center rounded text-neutral-5 hover:text-primary-1 hover:bg-primary-5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                >
                                                    <ChevronDown size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Nom */}
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <CategoryAvatar name={cat.name} icon={cat.icon} />
                                            <span className="font-semibold text-neutral-8 dark:text-neutral-8">
                                                {cat.name}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Description */}
                                    <td className="px-5 py-3 text-neutral-6 dark:text-neutral-6 max-w-55 truncate">
                                        {cat.description || '—'}
                                    </td>

                                    {/* Nb produits */}
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-5 text-primary-1 font-semibold text-[11px] w-max">
                                            {productCount} produit{productCount > 1 ? 's' : ''}
                                        </span>
                                    </td>

                                    {/* Statut */}
                                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                                        <ProductStatusToggle
                                            active={cat.is_active}
                                            onChange={() => handleToggle(cat)}
                                        />
                                    </td>

                                    {/* Actions */}
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
        </div>
    );
};

export default CategoriesTable;