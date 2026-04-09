import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, Pencil, CheckCircle, XCircle,
    Package, Hash, TrendingUp, Loader2, Eye
} from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import Button from '../components/Button';
import ProductStatusToggle from '../components/products/ProductStatusToggle';
import CategoryFormModal from '../components/categories/CategoryFormModal';
import StatCard from '../components/dashboard/StatCard';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} F`;
const calcDiscount = (price, salePrice) =>
    salePrice ? Math.round(((Number(price) - Number(salePrice)) / Number(price)) * 100) : null;

const CategoryAvatar = ({ name, icon, size = 'md' }) => {
    const sizes = { md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-xl' };
    if (icon) return <img src={icon} alt={name} className={`${sizes[size]} rounded-md object-cover shrink-0`} loading="lazy" />;
    return (
        <div className={`${sizes[size]} rounded-md bg-primary-5 flex items-center justify-center shrink-0`}>
            <span className="font-bold font-poppins text-primary-1 uppercase">{name?.slice(0, 2) ?? '??'}</span>
        </div>
    );
};

// ── Tableau produits filtré par catégorie ─────────────────────
const CategoryProductsTable = ({ products, onUpdate, navigate }) => {
    if (products.length === 0) return (
        <div className="flex flex-col items-center gap-2 py-12 text-neutral-5">
            <Package size={32} />
            <p className="text-xs font-poppins">Aucun produit dans cette catégorie</p>
        </div>
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs font-poppins">
                <thead>
                    <tr className="bg-neutral-2 dark:bg-neutral-2 border-b border-neutral-4 dark:border-neutral-4">
                        {['Produit', 'Prix', 'Réduction', 'Stock', 'Statut', 'Actions'].map(col => (
                            <th key={col} className="text-left px-4 py-3 text-neutral-6 dark:text-neutral-6 font-semibold uppercase tracking-wide whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => {
                        const discount = calcDiscount(product.price, product.sale_price);
                        return (
                            <tr
                                key={product.id}
                                onClick={() => navigate(`/products/${product.id}`)}
                                className="border-b border-neutral-4 dark:border-neutral-4 last:border-0 hover:bg-neutral-2 dark:hover:bg-neutral-2 transition-colors duration-150 cursor-pointer"
                            >
                                {/* Produit */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {product.image
                                            ? <img src={product.image} alt={product.name} className="w-9 h-9 rounded-md object-cover shrink-0" loading="lazy" />
                                            : <div className="w-9 h-9 rounded-md bg-secondary-5 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-bold font-poppins text-secondary-1 uppercase">{product.name?.slice(0, 2)}</span>
                                            </div>
                                        }
                                        <span className="font-medium text-neutral-8 dark:text-neutral-8 max-w-45 truncate">{product.name}</span>
                                    </div>
                                </td>

                                {/* Prix */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-neutral-8 dark:text-neutral-8">
                                            {formatPrice(product.sale_price ?? product.price)}
                                        </span>
                                        {product.sale_price && (
                                            <span className="line-through text-neutral-5 text-[11px]">{formatPrice(product.price)}</span>
                                        )}
                                    </div>
                                </td>

                                {/* Réduction */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {discount
                                        ? <span className="text-success-1 font-semibold">-{discount}%</span>
                                        : <span className="text-neutral-5">—</span>
                                    }
                                </td>

                                {/* Stock */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`font-semibold ${product.unlimited_stock ? 'text-primary-1' : product.stock === 0 ? 'text-danger-1' : product.stock <= 5 ? 'text-warning-1' : 'text-neutral-8 dark:text-neutral-8'}`}>
                                        {product.unlimited_stock ? 'Illimité' : product.stock === 0 ? 'Rupture' : `${product.stock} unité${product.stock > 1 ? 's' : ''}`}
                                    </span>
                                </td>

                                {/* Statut */}
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                    <ProductStatusToggle
                                        active={product.is_active}
                                        onChange={() => onUpdate?.(product.id, { is_active: !product.is_active })}
                                    />
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => navigate(`/products/${product.id}`)}
                                        title="Voir le détail"
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-6 hover:bg-secondary-5 hover:text-secondary-1 transition-colors cursor-pointer"
                                    >
                                        <Eye size={14} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ── Page principale ───────────────────────────────────────────
const CategoryDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { categories, loading: catLoading, update: updateCategory } = useCategories();
    const { products, loading: prodLoading, update: updateProduct } = useProducts();

    // Cherche la catégorie dans la liste
    const category = useMemo(() =>
        categories.find(c => String(c.id) === String(id)) ?? null,
        [categories, id]);

    // Produits filtrés par cette catégorie
    const catProducts = useMemo(() =>
        products.filter(p => String(p.category) === String(id)),
        [products, id]);

    useEffect(() => {
        if (category) document.title = `Admin Tokia-Loh | ${category.name}`;
    }, [category]);

    useEffect(() => {
        if (!catLoading && categories.length > 0 && !category)
            navigate('/categories', { replace: true });
    }, [catLoading, categories, category, navigate]);

    // Stats calculées depuis les produits réels
    const stats = useMemo(() => {
        const actifs = catProducts.filter(p => p.is_active).length;
        const ruptures = catProducts.filter(p => !p.unlimited_stock && p.stock === 0).length;
        const caTotal = catProducts.reduce((acc, p) => acc + Number(p.sale_price ?? p.price), 0);
        return { actifs, ruptures, caTotal };
    }, [catProducts]);

    if (catLoading || prodLoading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 size={24} className="animate-spin text-primary-1" />
        </div>
    );

    if (!category) return null;

    const handleToggleStatus = () => {
        updateCategory(category.id, { is_active: !category.is_active });
    };

    const handleEdit = () => navigate(`/categories/${category.id}/edit`);

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
                        <h1 className="text-h5 font-bold font-poppins text-neutral-8 dark:text-neutral-8">{category.name}</h1>
                        <p className="text-xs font-poppins text-neutral-6 mt-0.5">Détail de la catégorie</p>
                    </div>
                </div>
                <Button variant="primary" size="normal" onClick={handleEdit}>
                    <Pencil size={14} /> Modifier la catégorie
                </Button>
            </div>

            {/* ── Fiche catégorie ── */}
            <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 p-5 flex flex-col sm:flex-row items-start gap-5">
                <CategoryAvatar name={category.name} icon={category.icon} size="lg" />

                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-base font-bold font-poppins text-neutral-8 dark:text-neutral-8">{category.name}</h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-poppins ${category.is_active ? 'bg-success-2 text-success-1' : 'bg-neutral-3 text-neutral-6'}`}>
                            {category.is_active ? <><CheckCircle size={11} /> Active</> : <><XCircle size={11} /> Inactive</>}
                        </span>
                    </div>

                    <p className="text-xs font-poppins text-neutral-6">
                        {category.description || <span className="italic">Aucune description</span>}
                    </p>

                    <div className="flex items-center gap-5 flex-wrap pt-1">
                        {category.order && (
                            <div className="flex items-center gap-1.5 text-xs font-poppins text-neutral-6">
                                <Hash size={12} className="text-primary-1" />
                                Ordre : <span className="font-semibold text-neutral-8 dark:text-neutral-8 ml-1">{category.order}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs font-poppins text-neutral-6">
                            <Package size={12} className="text-primary-1" />
                            <span className="font-semibold text-neutral-8 dark:text-neutral-8">{catProducts.length}</span> produit{catProducts.length > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-poppins text-neutral-5">Statut</span>
                    <ProductStatusToggle active={category.is_active} onChange={handleToggleStatus} />
                </div>
            </div>

            {/* ── StatCards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Produits total" value={String(catProducts.length)} icon={<Package size={18} />} color="primary" />
                <StatCard title="Produits actifs" value={String(stats.actifs)} icon={<CheckCircle size={18} />} color="success"
                    trend={stats.actifs > 0 ? 'up' : 'neutral'}
                    trendLabel={`${Math.round((stats.actifs / (catProducts.length || 1)) * 100)}%`} />
                <StatCard title="En rupture" value={String(stats.ruptures)} icon={<XCircle size={18} />} color="danger" />
                <StatCard title="Valeur catalogue" value={`${stats.caTotal.toLocaleString('fr-FR')} F`} icon={<TrendingUp size={18} />} color="secondary" />
            </div>

            {/* ── Tableau produits ── */}
            <div className="bg-neutral-0 dark:bg-neutral-0 border border-neutral-4 dark:border-neutral-4 rounded-3 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-4 dark:border-neutral-4">
                    <div>
                        <p className="text-sm font-bold font-poppins text-neutral-8 dark:text-neutral-8">Produits de la catégorie</p>
                        <p className="text-[11px] font-poppins text-neutral-5 mt-0.5">
                            {catProducts.length} produit{catProducts.length > 1 ? 's' : ''} dans "{category.name}"
                        </p>
                    </div>
                </div>
                <CategoryProductsTable products={catProducts} onUpdate={updateProduct} navigate={navigate} />
            </div>
        </div>
    );
};

export default CategoryDetailPage;