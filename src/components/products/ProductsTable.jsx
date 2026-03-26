import React, { useState, useMemo } from 'react';
import { Search, Pencil, Trash2, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import ProductStatusToggle from './ProductStatusToggle';
import ProductBadge from './ProductBadge';

const formatPrice = (p) => p ? `${Number(p).toLocaleString('fr-FR')} F` : '—';

/**
 * API : price = prix de vente, original_price = prix barré (avant réduction)
 * Réduction = (original_price - price) / original_price
 */
const calcDiscount = (price, originalPrice) => {
    if (!originalPrice) return null;
    const p = Number(price), o = Number(originalPrice);
    if (!p || !o || p >= o) return null;
    return Math.round(((o - p) / o) * 100);
};

const getStockBadgeType = (stock) => {
    if (stock === 0) return 'out-of-stock';
    if (stock <= 5) return 'low-stock';
    return null;
};

const ProductAvatar = ({ name, image }) => {
    if (image) return (
        <img src={image} alt={name} className="w-10 h-10 rounded-md object-cover shrink-0" />
    );
    return (
        <div className="w-10 h-10 rounded-md bg-secondary-5 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold font-poppins text-secondary-1 uppercase">
                {name?.slice(0, 2) ?? '??'}
            </span>
        </div>
    );
};

/*
  Props :
  - products   : tableau issu de useProducts()
  - loading    : boolean
  - categories : tableau issu de useCategories()
  - onEdit     : (product) => void
  - onDelete   : (product) => void
  - onUpdate   : (id, payload) => Promise  — pour toggle statut
*/
const ProductsTable = ({ products = [], loading = false, categories = [], onEdit, onDelete, onUpdate }) => {
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('Toutes');
    const [stockFilter, setStockFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // ── Noms de catégories pour le filtre ─────────────────────
    const categoryNames = useMemo(() =>
        ['Toutes', ...categories.map(c => c.name)],
        [categories]);

    // ── Filtrage ──────────────────────────────────────────────
    const filtered = useMemo(() => {
        return products.filter(p => {
            const name = p.name ?? '';
            const catName = categories.find(c => c.id === p.category)?.name ?? p.category ?? '';
            const matchSearch = name.toLowerCase().includes(search.toLowerCase());
            const matchCat = catFilter === 'Toutes' || catName === catFilter;
            const matchStock = stockFilter === 'all' ? true
                : stockFilter === 'out' ? p.stock === 0
                    : p.stock <= 5 && p.stock > 0;
            // API : "status" (bool) — était status
            const isActive = p.status ?? true;
            const matchStatus = statusFilter === 'all' ? true
                : statusFilter === 'active' ? isActive
                    : !isActive;
            return matchSearch && matchCat && matchStock && matchStatus;
        });
    }, [products, categories, search, catFilter, stockFilter, statusFilter]);

    // ── Toggle statut (optimistic) ────────────────────────────
    // On envoie "status" pour l'API — useProducts.update gère la rétro-compat status
    const handleToggleStatus = (product) => {
        const current = product.status ?? true;
        console.log('payload envoyé →', { status: !current });
        onUpdate?.(product.id, { status: !current });
    };

    return (
        <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">

            {/* ── Filtres ── */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-neutral-4 dark:border-neutral-4">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-6 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs font-poppins rounded-full bg-neutral-3 dark:bg-neutral-3 border border-transparent text-neutral-8 dark:text-neutral-8 placeholder:text-neutral-6 outline-none focus:border-primary-1 focus:bg-neutral-0 dark:focus:bg-neutral-0 focus:ring-2 focus:ring-primary-5 transition-all duration-200"
                    />
                </div>

                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-poppins rounded-full cursor-pointer bg-neutral-3 dark:bg-neutral-3 border border-transparent text-neutral-7 dark:text-neutral-7 outline-none focus:border-primary-1 transition-all duration-200">
                    {categoryNames.map(c => <option key={c}>{c}</option>)}
                </select>

                <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-poppins rounded-full cursor-pointer bg-neutral-3 dark:bg-neutral-3 border border-transparent text-neutral-7 dark:text-neutral-7 outline-none focus:border-primary-1 transition-all duration-200">
                    <option value="all">Tout le stock</option>
                    <option value="low">Stock faible</option>
                    <option value="out">Rupture</option>
                </select>

                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-poppins rounded-full cursor-pointer bg-neutral-3 dark:bg-neutral-3 border border-transparent text-neutral-7 dark:text-neutral-7 outline-none focus:border-primary-1 transition-all duration-200">
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                </select>

                <span className="text-[11px] font-poppins text-neutral-6 whitespace-nowrap ml-auto">
                    {filtered.length} produit{filtered.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Tableau ── */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs font-poppins">
                    <thead>
                        <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                            {['Produit', 'Catégorie', 'Prix', 'Réduction', 'Stock', 'Statut', 'Actions'].map(col => (
                                <th key={col} className="text-left px-4 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center">
                                    <Loader2 size={20} className="animate-spin text-primary-1 mx-auto" />
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-neutral-6 dark:text-neutral-6">
                                    Aucun produit trouvé
                                </td>
                            </tr>
                        ) : filtered.map(product => {
                            const catName = categories.find(c => c.id === product.category)?.name ?? product.category ?? '—';
                            // API : original_price = prix barré, price = prix de vente
                            const discount = calcDiscount(product.price, product.original_price);
                            const stockBadge = getStockBadgeType(product.stock);
                            const isActive = product.status ?? true; // ← retire product.status ??

                            return (
                                <tr
                                    key={product.id}
                                    onClick={() => navigate(`/products/${product.id}`)}
                                    className="border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors duration-150 cursor-pointer"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <ProductAvatar name={product.name} image={product.image} />
                                            <span className="font-medium text-neutral-8 dark:text-neutral-8 max-w-40 truncate">
                                                {product.name}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-neutral-6 dark:text-neutral-6 whitespace-nowrap">{catName}</td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            {/* Prix de vente affiché en premier */}
                                            <span className="font-semibold text-neutral-8 dark:text-neutral-8">
                                                {formatPrice(product.price)}
                                            </span>
                                            {/* original_price = prix barré */}
                                            {product.original_price && (
                                                <span className="line-through text-neutral-5 text-[11px]">
                                                    {formatPrice(product.original_price)}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {discount
                                            ? <span className="text-success-1 font-semibold">-{discount}%</span>
                                            : <span className="text-neutral-5">—</span>
                                        }
                                    </td>

                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${product.stock === 0 ? 'text-danger-1' : product.stock <= 5 ? 'text-warning-1' : 'text-neutral-8 dark:text-neutral-8'}`}>
                                                {product.stock}
                                            </span>
                                            {stockBadge && <ProductBadge type={stockBadge} />}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                        <ProductStatusToggle
                                            active={isActive}
                                            onChange={() => handleToggleStatus(product)}
                                        />
                                    </td>

                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => navigate(`/products/${product.id}`)}
                                                title="Voir le détail"
                                                className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-secondary-5 hover:text-secondary-1 transition-colors duration-150 cursor-pointer"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            <button
                                                onClick={() => onEdit?.(product)}
                                                title="Modifier"
                                                className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-primary-5 hover:text-primary-1 transition-colors duration-150 cursor-pointer"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDelete?.(product)}
                                                title="Supprimer"
                                                className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-danger-2 hover:text-danger-1 transition-colors duration-150 cursor-pointer"
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

export default ProductsTable;